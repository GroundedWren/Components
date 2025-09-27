/**
 * @file Image loader control
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Controls(ns) {
	ns.ImageLoaderEl = class ImageLoaderEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		//Element name
		static Name = "gw-image-loader";
		// Element CSS rules
		static Style = `${ImageLoaderEl.Name} {
			display: contents;
		}`;

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(ImageLoaderEl.Name).prototype);
			}
			this.InstanceId = ImageLoaderEl.InstanceCount++;
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

		/** How long the loading transition is in ms */
		get TransitionLength() {
			const attrInt = parseInt(this.getAttribute("data-transition"))
			return isNaN(attrInt) ? 120 : attrInt;
		}

		/**
		 * Generates a globally unique ID for a key unique to the custom element instance
		 * @param {String} key Unique key within the custom element
		 * @returns A globally unique ID
		 */
		getId(key) {
			return `${ImageLoaderEl.Name}-${this.InstanceId}-${key}`;
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
			delete ImageLoaderEl.InstanceMap[this.InstanceId];
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Root.querySelector(`style.${ImageLoaderEl.Name}`)) {
				this.Head.insertAdjacentHTML(
					"beforeend",
					`<style class=${ImageLoaderEl.Name}>${ImageLoaderEl.Style}</style>`
				);
			}

			ImageLoaderEl.InstanceMap[this.InstanceId] = this;
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

			if(!this.getAttribute("id")) {
				this.setAttribute("id", this.getId());
			}

			this.insertAdjacentHTML("afterbegin", `<style>
				${`#${this.getAttribute("id")}`} {
					img {
						&:not(.loaded) {
							opacity: 0;
						}

						&.staged {
							transition: opacity ${this.TransitionLength}ms;

							&:not(.loaded) {
								${this.#getBgColorDeclaration()}
							}

							&.loading {
								transition: opacity ${this.TransitionLength}ms,
											background-color ${this.TransitionLength}ms;

								&:not(.loaded) {
									content-visibility: hidden;
									opacity: 0.5;
								}
							}
						}
						${this.#getDimensionsRuleset()}
					}
				}
			</style>`);

			this.#updateImages();

			new MutationObserver(() => { this.#updateImages() }).observe(
				this,
				{childList: true, subtree: true}
			);

			this.IsInitialized = true;
		}

		#getBgColorDeclaration() {
			if (this.hasAttribute("data-color-var")) {
				return `background-color: var(${
					this.getAttribute("data-color-var")
				}${this.hasAttribute("data-color")
					? `, ${this.getAttribute("data-color")}`
					: ""
				});`
			}
			if(this.hasAttribute("data-color")) {
				return `background-color: ${this.getAttribute("data-color")};`
			}
			return "";
		}

		#getDimensionsRuleset() {
			const width = parseFloat(this.getAttribute("data-w"));
			const height = parseFloat(this.getAttribute("data-h"));
			if(isNaN(width) || isNaN(height)) {
				return "";
			}
			return `
				aspect-ratio: ${width} / ${height};
				max-width: ${width}px;
				width: 100%;
			`;
		}

		async #updateImages() {
			await new Promise(resolve => setTimeout(resolve, 0));

			this.querySelectorAll(`img:not(.staged)`).forEach(imgEl => {
				imgEl.classList.add("staged");
			});

			await new Promise(resolve => setTimeout(resolve, 0));
			
			this.querySelectorAll(`img.staged`).forEach(imgEl => {
				imgEl.classList.add("loading");
				if(!imgEl.complete) {
					imgEl.addEventListener('load', () => this.#markImageLoaded(imgEl));
				}
				else {
					this.#markImageLoaded(imgEl);
				}
			});
		}

		async #markImageLoaded(imgEl) {
			await new Promise(resolve => setTimeout(resolve, this.TransitionLength));

			imgEl.classList.add("loaded");

			setTimeout(() => {
				imgEl.classList.remove("staged");
				imgEl.classList.remove("loading");
			}, this.TransitionLength);
		}
	}
	if(!customElements.get(ns.ImageLoaderEl.Name)) {
		customElements.define(ns.ImageLoaderEl.Name, ns.ImageLoaderEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.ImageLoaderEl");