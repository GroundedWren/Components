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
			EndnoteEl.#CommonStyleSheet.replaceSync(`${EndnoteEl.Name} {
				--gw-endnote-display: defined-but-invalid;

				display: inline;
				border: 1px dotted var(--text-color, black);
				padding: 1px;

				&:not(:is(:hover, :focus-within):not(.suppressed)) {
					> .note {
						display: none;
					}
				}

				&:hover, &:focus, &:focus-within {
					background-color: var(--mark-color, azure);
				}

				> .note {
					position: absolute;
					position-area: end span-all
					position-try-fallbacks: flip-block, flip-inline;

					background-color: color-mix(in oklab, var(--background-color, white) 60%, transparent);
					backdrop-filter: blur(10px);
					padding: 5px;
					margin-inline: 2px;
					box-shadow: 2px 2px 8px 0px var(--text-color, black);
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
						inset-block-start: 0px;
					}
				}
			}
			.gw-endnote {
				display: var(--gw-endnote-display, none);
			}
			`);
		}

		static #renderKeys = [];
		static requestRender(key) {
			if(!EndnoteEl.#renderKeys.length) {
				setTimeout(() => {
					for(const key of EndnoteEl.#renderKeys) {
						const allEndnotes = Object.values(EndnoteEl.InstanceMap).filter(
							endnote => endnote.dataset.key === key
						);
						allEndnotes.forEach((endnote, index) => { endnote.render(index); });

						const allEndnoteLists = Object.values(ns.EndnoteListEl.InstanceMap).filter(
							enList => enList.dataset.key === key
						);
						allEndnoteLists.forEach(enList => enList.render(allEndnotes));
					}
					EndnoteEl.#renderKeys = [];
				}, 0);
			}
			EndnoteEl.#renderKeys.push(key);
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
					if(event.key === "Escape") {
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
					EndnoteEl.requestRender(this.dataset.key);
				});
			}
			else {
				this.#initialize();
				EndnoteEl.requestRender(this.dataset.key);
			}
		}

		#preInitialize() {
			if(this.IsInitialized) {
				return;
			}
			requestAnimationFrame(() => {
				this.insertAdjacentHTML(`beforeend`, `<sup id="${this.getId("sup")}">*</sup>`);
			});
		}

		/** First-time setup */
		#initialize() {
			if(this.IsInitialized) { return; }

			this.#StyleSheet.replaceSync(`
				${EndnoteEl.Name}[data-instance="${this.InstanceId}"] {
					anchor-name: --${this.getId("anchor")};
				}
				
				#${this.getId("note")} {
  					position-anchor: --${this.getId("anchor")};
				}
			`);

			["focusin", "mousein"].forEach(evt => this.addEventListener(evt, () => {
				if(this.dataset.showing === "yes") { return; }
				this.dataset.showing = "yes";
				this.announce("Endnote bubble shown");
			}));

			["focusout", "mouseout"].forEach(evt => this.addEventListener(evt, () => {
				if(!this.matches(`:focus-within, :hover, :focus`)) {
					this.dataset.showing = "no";
					this.announce("Endnote bubble hidden");	
				}
			}));

			this.setAttribute("role", "group");
			this.setAttribute("aria-label", "endnote context");
			this.setAttribute("tabindex", "0");
			this.insertAdjacentHTML(
				`beforeend`,
				`<aside id="${this.getId("note")}" class="note"></aside>`
			);
			this.insertAdjacentHTML("beforeend", `<a
				id="${this.getId("link")}"
				href="#${this.getId("listitem")}"
				class="jump-link"
			>Jump to endnote</a>`);
			[this, this.getRef("link")].forEach(el => el.addEventListener("click",
				(event) => {
					if(!this.getRef("note").contains(event.target)) {
						this.Root.getElementById(this.getId("listitem")).focus();
					}
				}
			));
			this.getRef("note").append(this.Root.getElementById(this.dataset.contentId));

			this.IsInitialized = true;
		}

		render(index) {
			requestAnimationFrame(() => {
				this.getRef("sup").innerText = index + 1;
				this.setAttribute("aria-label", `endnote ${index + 1} context`);
			});
		}

		static #PopupTriggerEvents = ["mousein", "mouseout", "focus", "blur"];
		#suppressPopup() {
			this.classList.add("suppressed");
			this.announce("Endnote suppressed.");
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
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.EndnoteEl");

window.GW = window.GW || {};
(function Controls(ns) {
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
				
				li:focus {
					box-shadow: -3px 0px 0px 0px var(--shadow-color, #585191);
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
		attributeChangedCallback(name, oldValue, newValue) {
			
		}

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
			this.innerHTML = `<ol aria-label="Endnotes">
				${noteList.map(note => `<li
					id="${note.getId("listitem")}"
					tabindex="-1"
				>${note.getRef("note").outerHTML}</li>`).join("")}
			</ol>`;
		}
	}
	if(!customElements.get(ns.EndnoteListEl.Name)) {
		customElements.define(ns.EndnoteListEl.Name, ns.EndnoteListEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.EndnoteListEl");