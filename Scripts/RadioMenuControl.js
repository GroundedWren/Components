window.GW = window.GW || {};
(function Controls(ns) {
	ns.RadioMenu = class RadioMenu extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached
		static ResetMs = 500;

		// Element name
		static Name = "gw-radiomenu";

		// Attributes whose changes we respond to
		static observedAttributes = [];

		// Element CSSStyleSheet
		static #CommonStyleSheet = new CSSStyleSheet();
		static #CommonStyleAttribute = `data-${RadioMenu.Name}-style`;
		static {
			RadioMenu.#CommonStyleSheet.replaceSync(`${RadioMenu.Name} {
			}`);
		}

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content
		#InitRes;
		InitPromise = new Promise(resolve => this.#InitRes = resolve);

		#StyleSheet; // CSSStyleSheet for this instance
		#StyleAttribute; // Identifying attribute for this instance's CSSStyleSheet

		#ButtonList;

		//Type-ahead
		KeyMap = {};
		CurKeySequence = [];
		LastKeyTimestamp = new Date(-8640000000000000); //Earliest representable date

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(RadioMenu.Name).prototype);
			}
			this.InstanceId = RadioMenu.InstanceCount++;

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
			return `${RadioMenu.Name}-${this.InstanceId}-${key}`;
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
			delete RadioMenu.InstanceMap[this.InstanceId];
		}
		/** Handler invoked when any of the observed attributes are changed */
		attributeChangedCallback(name, oldValue, newValue) {
			
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Head.hasAttribute(RadioMenu.#CommonStyleAttribute)) {
				this.Head.setAttribute(RadioMenu.#CommonStyleAttribute, "");
				this.Root.adoptedStyleSheets.push(RadioMenu.#CommonStyleSheet);
			}
			if(!this.Head.hasAttribute(this.#StyleAttribute)) {
				this.Head.setAttribute(this.#StyleAttribute, "");
				this.Root.adoptedStyleSheets?.push(this.#StyleSheet);
			}
			this.setAttribute("data-instance", this.InstanceId);

			RadioMenu.InstanceMap[this.InstanceId] = this;
			if(document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", () => {
					this.#initialize();
				});
			}
			else {
				this.#initialize();
			}
		}

		uncheck() {
			const checkedButton = this.querySelector(`[aria-checked="true"]`);
			if(checkedButton) {
				checkedButton.setAttribute("aria-checked", "false");
			}
		}

		/** First-time setup */
		#initialize() {
			if(this.IsInitialized) { return; }

			this.setAttribute("role", "menu");

			this.#ButtonList = Array.from(this.querySelectorAll(`button`));

			for(let i = 0; i < this.#ButtonList.length; i++) {
				const buttonEl = this.#ButtonList[i];
				buttonEl.setAttribute("role", "menuitemradio");
				buttonEl.setAttribute("tabindex", i === 0 ? "0" : "-1");
				buttonEl.setAttribute("data-index", i);
				if(!buttonEl.hasAttribute("aria-checked")) {
					buttonEl.setAttribute("aria-checked", "false");
				}
				buttonEl.addEventListener("keydown", this.#onButtonKeydown);
				buttonEl.addEventListener("click", this.#onButtonClick);
				buttonEl.addEventListener("focusin", this.#onButtonFocusin);

				this.#addToKeyMap(buttonEl.innerText.trim(), buttonEl);
			}

			this.IsInitialized = true;
			this.#InitRes();
		}

		#onButtonFocusin = (event) => {
			this.#ButtonList.forEach(button => button.setAttribute("tabindex", "-1"));
			event.target.setAttribute("tabindex", "0");
		};

		#onButtonKeydown = (event) => {
			const button = event.target.closest(`button`);
			let btnIdx = this.#ButtonList.indexOf(button);

			switch(event.key) {
				case "ArrowUp":
					event.preventDefault();
					btnIdx--;
					break;
				case "ArrowDown":
					event.preventDefault();
					btnIdx++;
					break;
				case "Home":
					btnIdx = 0;
					break;
				case "End":
					btnIdx = this.#ButtonList.length - 1;
					break;
				default:
					const matchedItem = this.#getFirstMatch(event.key);
					if(matchedItem) {
						btnIdx = parseInt(matchedItem.getAttribute("data-index"));
					}
			}

			btnIdx = Math.min(Math.max(btnIdx, 0), this.#ButtonList.length - 1);
			
			const newButton = this.#ButtonList[btnIdx];
			newButton.focus();
		};

		#onButtonClick = (event) => {
			const button = event.target.closest(`button`);
			if(button.getAttribute("aria-checked") !== "true") {
				this.#ButtonList.forEach(button => button.setAttribute("aria-checked", "false"));
				button.setAttribute("aria-checked", "true");
				this.dispatchEvent(new CustomEvent("change", {detail: {Selection: button}}));
			}
			else if(!this.hasAttribute("noUnselect")) {
				button.setAttribute("aria-checked", "false");
				this.dispatchEvent(new CustomEvent("change", {detail: {Selection: null}}));
			}
		};

		/**
		 * Enables an option for type-ahead functionality
		 * @param {string} text Option's text
		 * @param {HTMLElement} menuItemEl Menu Item element
		 */
		#addToKeyMap(text, menuItemEl) {
			let currentLevel = this.KeyMap;
			text.split("").forEach(character => {
				const chaKey = character.toLowerCase();
				currentLevel[chaKey] = currentLevel[chaKey] || {};
				currentLevel = currentLevel[chaKey];
				(currentLevel.ItemElAry = currentLevel.ItemElAry || []).push(menuItemEl);
			});
		}

		/**
		 * Finds a type-ahead match
		 * @param {string} key Latest typed character
		 * @returns {HTMLElement | null} Item element match
		 */
		#getFirstMatch(key) {
			const chaKey = key.toLowerCase();
			const keyTimestamp = new Date();
			if(keyTimestamp - this.LastKeyTimestamp > RadioMenu.ResetMs) {
				this.CurKeySequence = [];
			}
			this.LastKeyTimestamp = keyTimestamp;

			this.CurKeySequence.push(chaKey);

			let sequenceObj = this.KeyMap;
			this.CurKeySequence.forEach(chaKey => sequenceObj = sequenceObj[chaKey] || {});

			if(!sequenceObj.ItemElAry) {
				if(this.KeyMap[chaKey]?.ItemElAry) {
					this.CurKeySequence = [chaKey];
					sequenceObj = this.KeyMap[chaKey];
				}
				else {
					this.CurKeySequence = [];
					return null;
				}
			}

			return sequenceObj.ItemElAry[0];
		}
	}
	if(!customElements.get(ns.RadioMenu.Name)) {
		customElements.define(ns.RadioMenu.Name, ns.RadioMenu);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.RadioMenu");