/**
 * @file Background image control
 * @author Vera Konigin vera@groundedwren.com
 */

window.GW = window.GW || {};
(function Controls(ns) {	
	ns.BackgroundImageEl = class BackgroundImageEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		// Element name
		static Name = "gw-background-image";

		// Attributes whose changes we respond to
		static observedAttributes = [];

		// Element CSSStyleSheet
		static #CommonStyleSheet = new CSSStyleSheet();
		static #CommonStyleAttribute = `data-${BackgroundImageEl.Name}-style`;
		static {
			BackgroundImageEl.#CommonStyleSheet.replaceSync(`${BackgroundImageEl.Name} {
				display: contents;
			}
			html {
				.page-background, .page-background img {
					position: fixed;
					min-width: 100vw;
					min-height: 100vh;

					z-index: -1;
					left: 0;
					top: 0;
				}
				@media print {
					.page-background {
						display: none;
					}
				}
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
				Object.setPrototypeOf(this, customElements.get(BackgroundImageEl.Name).prototype);
			}
			this.InstanceId = BackgroundImageEl.InstanceCount++;

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
			return `${BackgroundImageEl.Name}-${this.InstanceId}-${key}`;
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
			delete BackgroundImageEl.InstanceMap[this.InstanceId];
		}
		/** Handler invoked when any of the observed attributes are changed */
		attributeChangedCallback(name, oldValue, newValue) {
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Head.hasAttribute(BackgroundImageEl.#CommonStyleAttribute)) {
				this.Head.setAttribute(BackgroundImageEl.#CommonStyleAttribute, "");
				this.Root.adoptedStyleSheets.push(BackgroundImageEl.#CommonStyleSheet);
			}
			if(!this.Head.hasAttribute(this.#StyleAttribute)) {
				this.Head.setAttribute(this.#StyleAttribute, "");
				this.Root.adoptedStyleSheets?.push(this.#StyleSheet);
			}
			this.setAttribute("data-instance", this.InstanceId);

			BackgroundImageEl.InstanceMap[this.InstanceId] = this;
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

			const attrMap = {};
			this.getAttributeNames().reduce((map, attr) => {
				const attrPieces = attr.split("_");
				if(attrPieces.length === 2
					&& (
						attrPieces[0].toUpperCase() === "SRC"
						|| attrPieces[0].toUpperCase() === "SRCSMALL"
						|| attrPieces[0].toUpperCase() === "SMALLWIDTH"
						|| attrPieces[0].toUpperCase() === "COLOR"
						|| attrPieces[0].toUpperCase() === "COLORVAR"
						|| attrPieces[0].toUpperCase() === "NAME"
					)
				) {
					map[attrPieces[1]] = map[attrPieces[1]] || {};
					map[attrPieces[1]][attrPieces[0].toUpperCase()] = this.getAttribute(attr);
				}
				return map;
			}, attrMap);

			const attrGroups = Object.values(attrMap);

			this.setAttribute("data-instance", this.InstanceId);

			if(!this.hasAttribute("image")) {
				if(window.matchMedia(`(prefers-color-scheme: dark)`).matches) {
					this.setAttribute("image", this.getAttribute("dark") || attrGroups[0].NAME);
				}
				else {
					this.setAttribute("image", this.getAttribute("light") || attrGroups[0].NAME);
				}
			}

			this.#StyleSheet.replaceSync(`${BackgroundImageEl.Name}[data-instance="${this.InstanceId}"] {
				${attrGroups.map(attrGroup => `
					&[image="${attrGroup["NAME"]}"] {
						.page-background:not(.${attrGroup["NAME"]}) {
							display: none;
						}
						
						${this.#getSmallDeclarations(attrGroup)}

						.page-background {
							&::before {
								content: "";
								position: absolute;
								left: 0;
								top: 0;
								width: 100%;
								height: 100%;

								transition: opacity var(--transition-length, 1000ms);
								opacity: 1;
								${this.#getBgColorDeclaration(attrGroup)}
							}
							&.loaded {
								&::before {
									opacity: 0;
								}
							}
						}
					}
				`).join("\n")}
			}`);

			this.innerHTML = attrGroups.map(attrGroup => `
				<div class="page-background ${attrGroup["NAME"]}">
					<img src="${attrGroup["SRC"]}" alt="">
				</div>
				<div class="page-background small ${attrGroup["NAME"]}">
					<img src="${attrGroup["SRCSMALL"] || ""}" alt="">
				</div>
			`).join("\n");

			this.querySelectorAll(`.page-background`).forEach(bgEl => {
				const imgEl = bgEl.querySelector(`img`);
				if(!imgEl.complete) {
					imgEl.addEventListener('load', () => {
						bgEl.classList.add("loaded");
					});
				}
				else {
					bgEl.classList.add("loaded");
				}
			});

			this.IsInitialized = true;
		}

		#getSmallDeclarations(attrGroup) {
			if(!attrGroup["SRCSMALL"] || !attrGroup["SMALLWIDTH"]) {
				return "";
			}
			return `
				@media(width > ${attrGroup["SMALLWIDTH"]}) {
					.page-background.small {
						display: none;
					}
				}
				@media(width <= ${attrGroup["SMALLWIDTH"]}) {
					.page-background:not(.small) {
						display: none;
					}
				}
			`;
		}

		#getBgColorDeclaration(attrGroup) {
			if(attrGroup["COLORVAR"]) {
				return `background-color: var(${attrGroup["COLORVAR"]}${attrGroup["COLOR"]
					? `, ${attrGroup["COLOR"]}`
					: ""}
				);`;
			}
			if(attrGroup["COLOR"]) {
				return `background-color: ${attrGroup["COLOR"]};`;
			}
			return "";
		}
	}
	if(!customElements.get(ns.BackgroundImageEl.Name)) {
		customElements.define(ns.BackgroundImageEl.Name, ns.BackgroundImageEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.BackgroundImageEl");