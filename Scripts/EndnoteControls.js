/**
 * @file Endnotes for written works
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Controls(ns) {
	ns.EndnoteEl = class EndnoteEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		// Element name
		static Name = "gw-endnote";

		// Attributes whose changes we respond to
		static observedAttributes = [];

		// Element CSSStyleSheet
		static #CommonStyleSheet = new CSSStyleSheet();
		static #CommonStyleAttribute = `data-${EndnoteEl.Name}-style`;
		static {
			EndnoteEl.#CommonStyleSheet.replaceSync(`${EndnoteEl.Name}:not([data-nested="true"]) {
				--gw-endnote-display: defined-but-invalid;

				display: inline;
				outline: 1px dotted var(--text-color, black);
				padding: 1px;
				padding-block-end: 0;

				cursor: pointer;

				&:not(:is(:hover, :focus-within):not(.suppressed)) {
					> .note {
						display: none;
					}
				}
				@media (hover: none) {
					> .note {
						display: none;
					}
				}

				&:hover, &:focus, &:focus-within {
					background-color: var(--mark-color, azure);
				}

				> .note {
					position: absolute;
					position-area: end span-all;
					position-try-fallbacks: flip-block, flip-inline;

					background-color: color-mix(in oklab, var(--background-color, white) 80%, transparent);
					backdrop-filter: blur(10px);
					padding: 5px;
					margin-inline: 2px;
					box-shadow: 2px 2px 8px 0px var(--text-color, black);
					max-width: 1100px;
					
					cursor: initial;
				}

				> .jump-link {
					position: absolute;
					position-area: center end;
					align-self: end;
					position-try-fallbacks: flip-block, flip-inline;
					background-color: var(--mark-color, azure);

					&:not(:focus-within) {
						position: absolute;
						inset-inline-start: -99999999px;
						inset-block-start: -99999999px;
						position-anchor: none !important;
					}
				}
			}
			.gw-endnote {
				display: var(--gw-endnote-display, none);

				p {
					display: inline;
					margin: 0;
				}
			}
			`);
		}

		static #renderKeys = new Set();
		static requestRender(key) {
			if(!EndnoteEl.#renderKeys.size) {
				setTimeout(() => {
					for(const key of EndnoteEl.#renderKeys) {
						const allEndnotes = Object.values(EndnoteEl.InstanceMap).filter(
							endnote => endnote.dataset.key === key && endnote.IsInitialized
						);
						allEndnotes.forEach((endnote, index) => { endnote.render(index); });
						
						const allEndnoteLists = Object.values(ns.EndnoteListEl.InstanceMap).filter(
							enList => enList.dataset.key === key
						);
						allEndnoteLists.forEach(enList => enList.render(allEndnotes));
					}
					EndnoteEl.#renderKeys.delete(key);
				}, 0);
			}
			EndnoteEl.#renderKeys.add(key);
		}

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content

		NoteHtml;

		#StyleSheet; // CSSStyleSheet for this instance
		#StyleAttribute; // Identifying attribute for this instance's CSSStyleSheet

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(EndnoteEl.Name).prototype);
			}
			this.InstanceId = EndnoteEl.InstanceCount++;

			this.#StyleSheet = new CSSStyleSheet();
			this.#StyleAttribute = `data-${this.getId("style")}`;
		}

		/** Shortcut for the root node of the element */
		get Root() {
			return this.getRootNode();
		}
		/** Looks up the <head> element (or a fascimile thereof in the shadow DOM) for the element's root */
		get Head() {
			if(this.Root.head) {
				return this.Root.head;
			}
			if(this.Root.getElementById("gw-head")) {
				return this.Root.getElementById("gw-head");
			}
			const head = document.createElement("div");
			head.setAttribute("id", "gw-head");
			this.Root.prepend(head);
			return head;
		}
		/** Looks up the <body> element (or a fascimile thereof in the shadow DOM) */
		get Body() {
			if(this.Root.body) {
				return this.Root.body;
			}
			if(this.Root.getElementById("gw-body")) {
				return this.Root.getElementById("gw-body");
			}
			const body = document.createElement("div");
			body.setAttribute("id", "gw-body");
			this.Root.prepend(body);
			return body;
		}

		/**
		 * Generates a globally unique ID for a key unique to the custom element instance
		 * @param {String} key Unique key within the custom element
		 * @returns A globally unique ID
		 */
		getId(key) {
			return `${EndnoteEl.Name}-${this.InstanceId}-${key}`;
		}
		/**
		 * Finds an element within the custom element created with an ID from getId
		 * @param {String} key Unique key within the custom element
		 * @returns The element associated with the key
		 */
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		/** Handler invoked when the element is attached to the page */
		connectedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is moved to a new document via adoptNode() */
		adoptedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is disconnected from the document */
		disconnectedCallback() {
			delete EndnoteEl.InstanceMap[this.InstanceId];
		}
		/** Handler invoked when any of the observed attributes are changed */
		attributeChangedCallback(name, oldValue, newValue) {
			
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Head.hasAttribute(EndnoteEl.#CommonStyleAttribute)) {
				this.Head.setAttribute(EndnoteEl.#CommonStyleAttribute, "");
				this.Root.adoptedStyleSheets.push(EndnoteEl.#CommonStyleSheet);
				this.Body.insertAdjacentHTML("beforeend", `<aside id="asiGWEndnoteLive" aria-live="polite"></aside>`);
				EndnoteEl.liveEl = document.getElementById("asiGWEndnoteLive");
			}
			if(!this.Head.hasAttribute(this.#StyleAttribute)) {
				this.Head.setAttribute(this.#StyleAttribute, "");
				this.Root.adoptedStyleSheets?.push(this.#StyleSheet);
				this.Root.addEventListener("keydown", (event) => {
					if(event.key === "Escape" && this.matches(`:focus-within, :focus, :hover`)) {
						this.#suppressPopup();
					}
				});
			}
			this.setAttribute("data-instance", this.InstanceId);

			EndnoteEl.InstanceMap[this.InstanceId] = this;
			this.#preInitialize();
			if(document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", () => {
					this.#initialize();
				});
			}
			else {
				this.#initialize();
			}
		}

		#IsPreInitialized
		#preInitialize() {
			if(this.IsInitialized || this.#IsPreInitialized) {
				return;
			}

			if(this.closest(`.gw-endnote`)
				&& !this.parentElement.closest(`${EndnoteEl.Name}, ${ns.EndnoteListEl.Name}`)
			) {
				// We're nested in an unsited note node.
				this.dataset.nested = true;
				return;
			}
			
			requestAnimationFrame(() => {
				this.insertAdjacentHTML(`beforeend`, `<sup id="${this.getId("sup")}" class="gw-endnote-sup">*</sup>`);
			});
			this.#IsPreInitialized = true;
		}

		/** First-time setup */
		#initialize() {
			EndnoteEl.requestRender(this.dataset.key);
			if(this.IsInitialized || !this.#IsPreInitialized) { return; }

			this.id = this.getId("self");

			const closestList = this.closest(`${ns.EndnoteListEl.Name}`);
			if(!closestList && this.parentElement.closest(`${EndnoteEl.Name}`)) {
				// We are nested
				this.dataset.nested = true;
				return;
			}
			this.dataset.nested = false;

			this.#StyleSheet.replaceSync(`
				${EndnoteEl.Name}[data-instance="${this.InstanceId}"] {
					anchor-name: --${this.getId("anchor")};
				}
				
				#${this.getId("note")}, #${this.getId("link")}{
  					position-anchor: --${this.getId("anchor")};
				}
			`);

			["focusin", "mouseenter"].forEach(evt => this.addEventListener(evt, () => {
				if(this.dataset.showing === "yes") { return; }
				this.dataset.showing = "yes";
				if(matchMedia("(hover: hover)").matches) {
					this.announce("Endnote bubble shown");
				}
			}));

			["focusout", "mouseleave"].forEach(evt => this.addEventListener(evt, () => {
				if(!this.matches(`:focus-within, :hover, :focus`)) {
					this.dataset.showing = "no";
					if(!this.classList.contains(`suppressed`) && matchMedia("(hover: hover)").matches) {
						this.announce("Endnote bubble hidden");	
					}
				}
			}));

			this.setAttribute("role", "group");
			this.setAttribute("aria-label", "endnote context");
			this.setAttribute("tabindex", "0");
			this.insertAdjacentHTML(
				`beforeend`,
				`<aside id="${this.getId("note")}" class="note"></aside>`
			);

			if(this.Root.querySelector(`gw-endnote-list[data-key="${this.dataset.key}"]`)) {
				this.insertAdjacentHTML("beforeend", `<a
					id="${this.getId("link")}"
					href="#${this.getId("listitem")}"
					class="jump-link"
				>Jump to endnote</a>`);
				[this, this.getRef("link")].forEach(el => el.addEventListener("click",
					(event) => {
						if(!this.getRef("note").contains(event.target)) {
							this.Root.getElementById(this.getId("listitem"))?.focus();
						}
					}
				));
			}
			this.NoteHTML = this.Root.getElementById(this.dataset.contentId).outerHTML;
			this.getRef("note").insertAdjacentHTML("beforeend", this.NoteHTML);

			this.IsInitialized = true;
		}

		render(index) {
			this.dataset.rendered = true;
			requestAnimationFrame(() => {
				this.getRef("sup").innerText = index + 1;
				this.setAttribute("aria-label", `endnote ${index + 1} context`);
			});
		}

		static #PopupTriggerEvents = ["mousein", "mouseout", "focus", "blur"];
		#suppressPopup() {
			this.classList.add("suppressed");
			if(matchMedia("(hover: hover)").matches) {
				this.announce("Endnote suppressed.");
			}
			EndnoteEl.#PopupTriggerEvents.forEach((eventType) => {
				this.addEventListener(eventType, this.#unsuppressPopup);
			});
		}
		#unsuppressPopup = () => {
			this.classList.remove("suppressed");
			EndnoteEl.#PopupTriggerEvents.forEach(() => {
				this.removeEventListener("mousein", this.#unsuppressPopup);
			});
		};
		
		#announceIdx = 0;
		/**
		 * Creates an assistive-tech only alert
		 * @param {string} text Information to provide to assistive tech
		 */
		announce(text) {
			this.#announceIdx++;
			const announceKey = this.getId(`announce-${this.#announceIdx}`);
			EndnoteEl.liveEl.insertAdjacentHTML("beforeend", `<span id="${announceKey}">${text}</span>`);
			setTimeout((announceKey) => {
				this.Root.getElementById(announceKey).remove();
			}, 1000, announceKey);
		}
	}
	if(!customElements.get(ns.EndnoteEl.Name)) {
		customElements.define(ns.EndnoteEl.Name, ns.EndnoteEl);
	}
	GW?.Controls?.Veil?.clearDefer("GW.Controls.EndnoteEl");

	ns.EndnoteListEl = class EndnoteListEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		// Element name
		static Name = "gw-endnote-list";

		// Attributes whose changes we respond to
		static observedAttributes = [];

		// Element CSSStyleSheet
		static #CommonStyleSheet = new CSSStyleSheet();
		static #CommonStyleAttribute = `data-${EndnoteListEl.Name}-style`;
		static {
			EndnoteListEl.#CommonStyleSheet.replaceSync(`${EndnoteListEl.Name} {
				--gw-endnote-display: defined-but-invalid;

				ol {
					list-style-position: inside;
				}

				li {
					padding-inline-start: 4px;
					
					&:focus {
						box-shadow: -3px 0px 0px 0px var(--mark-color, #585191);
						background-color: color-mix(in oklab, var(--mark-color, #585191) 20%, transparent);
					}

					&:not(:hover, :focus, :focus-within) {
						.return-link {
							opacity: 0;
						}
					}
					
					+ li {
						margin-block-start: 10px;
					}
				}
				
				.note {
					display: inline;
				}
			}
			#asiGWEndnoteLive {
				position: absolute;
				inset-inline-start: -99999999px;
				inset-block-start: 0px;
			}
			`);
		}

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content

		#StyleSheet; // CSSStyleSheet for this instance
		#StyleAttribute; // Identifying attribute for this instance's CSSStyleSheet

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(EndnoteListEl.Name).prototype);
			}
			this.InstanceId = EndnoteListEl.InstanceCount++;

			this.#StyleSheet = new CSSStyleSheet();
			this.#StyleAttribute = `data-${this.getId("style")}`;
		}

		/** Shortcut for the root node of the element */
		get Root() {
			return this.getRootNode();
		}
		/** Looks up the <head> element (or a fascimile thereof in the shadow DOM) for the element's root */
		get Head() {
			if(this.Root.head) {
				return this.Root.head;
			}
			if(this.Root.getElementById("gw-head")) {
				return this.Root.getElementById("gw-head");
			}
			const head = document.createElement("div");
			head.setAttribute("id", "gw-head");
			this.Root.prepend(head);
			return head;
		}

		/**
		 * Generates a globally unique ID for a key unique to the custom element instance
		 * @param {String} key Unique key within the custom element
		 * @returns A globally unique ID
		 */
		getId(key) {
			return `${EndnoteListEl.Name}-${this.InstanceId}-${key}`;
		}
		/**
		 * Finds an element within the custom element created with an ID from getId
		 * @param {String} key Unique key within the custom element
		 * @returns The element associated with the key
		 */
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		/** Handler invoked when the element is attached to the page */
		connectedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is moved to a new document via adoptNode() */
		adoptedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is disconnected from the document */
		disconnectedCallback() {
			delete EndnoteListEl.InstanceMap[this.InstanceId];
		}
		/** Handler invoked when any of the observed attributes are changed */
		attributeChangedCallback(name, oldValue, newValue) {}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Head.hasAttribute(EndnoteListEl.#CommonStyleAttribute)) {
				this.Head.setAttribute(EndnoteListEl.#CommonStyleAttribute, "");
				this.Root.adoptedStyleSheets.push(EndnoteListEl.#CommonStyleSheet);
			}
			if(!this.Head.hasAttribute(this.#StyleAttribute)) {
				this.Head.setAttribute(this.#StyleAttribute, "");
				this.Root.adoptedStyleSheets?.push(this.#StyleSheet);
			}
			this.setAttribute("data-instance", this.InstanceId);

			EndnoteListEl.InstanceMap[this.InstanceId] = this;
			if(document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", () => {
					this.#initialize();
				});
			}
			else {
				this.#initialize();
			}
		}

		/** First-time setup */
		#initialize() {
			if(this.IsInitialized) { return; }
			this.IsInitialized = true;
		}

		render(noteList) {
			function getNoteLi(note) {
				return ``;
			}

			this.innerHTML = `<ol id="${this.getId("list")}"></ol>`;
			noteList.forEach(note => this.appendNote(note));

			this.querySelectorAll(`${ns.EndnoteEl.Name}:not([data-rendered="true])`).forEach(endnote => {
				requestAnimationFrame(() => {
					const enl = this.Root.querySelector(`${EndnoteListEl.Name}[data-key="${endnote.dataset.key}"]`);
					endnote.render(enl?.querySelectorAll(`li`).length ?? 0);
					enl.appendNote(endnote);
				});
			});
		}

		appendNote(note) {
			this.getRef("list").insertAdjacentHTML(
				"beforeend",
				`<li
					id="${note.getId("listitem")}"
					tabindex="-1"
				>${note.NoteHTML}<a href="#${note.id}" class="return-link">Return</a></li>`
			);
		}
	}
	if(!customElements.get(ns.EndnoteListEl.Name)) {
		customElements.define(ns.EndnoteListEl.Name, ns.EndnoteListEl);
	}
	GW?.Controls?.Veil?.clearDefer("GW.Controls.EndnoteListEl");
}) (window.GW.Controls = window.GW.Controls || {});