/**
 * @file Sticky Collapse Control
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Controls(ns) {
	ns.StickyCollapseEl = class StickyCollapseEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		// Element name
		static Name = "gw-sticky-collapse";

		// Attributes whose changes we respond to
		static observedAttributes = [];

		// Element CSSStyleSheet
		static #CommonStyleSheet = new CSSStyleSheet();
		static #CommonStyleAttribute = `data-${StickyCollapseEl.Name}-style`;
		static {
			StickyCollapseEl.#CommonStyleSheet.replaceSync(`${StickyCollapseEl.Name} {
				display: contents;
			}`);
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
				Object.setPrototypeOf(this, customElements.get(StickyCollapseEl.Name).prototype);
			}
			this.InstanceId = StickyCollapseEl.InstanceCount++;

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
			return `${StickyCollapseEl.Name}-${this.InstanceId}-${key}`;
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
			delete StickyCollapseEl.InstanceMap[this.InstanceId];
		}
		/** Handler invoked when any of the observed attributes are changed */
		attributeChangedCallback(name, oldValue, newValue) {
			
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Head.hasAttribute(StickyCollapseEl.#CommonStyleAttribute)) {
				this.Head.setAttribute(StickyCollapseEl.#CommonStyleAttribute, "");
				this.Root.adoptedStyleSheets.push(StickyCollapseEl.#CommonStyleSheet);
			}
			if(!this.Head.hasAttribute(this.#StyleAttribute)) {
				this.Head.setAttribute(this.#StyleAttribute, "");
				this.Root.adoptedStyleSheets?.push(this.#StyleSheet);
			}
			this.setAttribute("data-instance", this.InstanceId);

			StickyCollapseEl.InstanceMap[this.InstanceId] = this;
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

			const summaryEl = this.querySelector(`summary`);
			if(summaryEl) {
				summaryEl.id = summaryEl.id || this.getId("summary");
				summaryEl.addEventListener("click", this.#onSummaryClick);
				this.#StyleSheet.replaceSync(`#${this.getId("summary")} {
					position: sticky !important;
					inset-block-start: var(--gw-sticky-start, 0px);
				}`);
			}

			this.IsInitialized = true;
		}

		#onSummaryClick = (_event) => {
			const scrollAncestor = this.#findScrollAncestor();
			const details = this.querySelector(`details`);
			if(!details) {
				return;
			}
			const scrollRect = scrollAncestor.getBoundingClientRect();
			const detailsRect = details.getBoundingClientRect();

			if(detailsRect.top >= 0 && detailsRect.top <= document.documentElement.clientHeight) {
				return;
			}
			
			const newScrollTop = detailsRect.top - scrollRect.top;
			requestAnimationFrame(() => {
				scrollAncestor.scrollTop = newScrollTop;
			});
		};

		#findScrollAncestor() {
			let element = this.querySelector(`summary`);
			while(element && element.scrollTop === 0) {
				element = element.parentElement;
			}
			return element ?? document.scrollingElement;
		}
	}
	if(!customElements.get(ns.StickyCollapseEl.Name)) {
		customElements.define(ns.StickyCollapseEl.Name, ns.StickyCollapseEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.StickyCollapseEl");