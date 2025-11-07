/**
 * @file Progress Ring Control
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Controls(ns) {
	ns.ProgressRingEl = class ProgressRingEl extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		//Element name
		static Name = "gw-progress-ring";

		static observedAttributes = ["numerator", "denominator", "name", "progressbar", "percent"];

		static #VbxWidth = 100;
		static #VbxHeight = 100;
		static #RingRadius = 43;
		static #RingCircumference = 2 * Math.PI * ProgressRingEl.#RingRadius;
		static #RingWidth = 5;
		static #DotRadius = 7;

		static #ToasterId = "gwProgressRingToaster";

		// Element CSSStyleSheet
		static #CommonStyleSheet = new CSSStyleSheet();
		static #CommonStyleAttribute = `data-${ProgressRingEl.Name}-style`;
		static {
			ProgressRingEl.#CommonStyleSheet.replaceSync(`${ProgressRingEl.Name} {
				display: grid;
				aspect-ratio: 1 / 1;
				container-type: size;

				&:is([data-progress-ratio="0"], [data-progress-ratio="1"]) {
					svg .dot {
						--opacity-step-position: end;
						opacity: 0;
					}
				}

				&[data-progress-ratio^="1."] {
					svg .base {
						stroke: var(--progress-color, green);
					}
				}

				svg {
					.base {
						fill: none;
						stroke: var(--ring-color, lightgray);
						stroke-width: ${ProgressRingEl.#RingWidth - 1};
					}
					.progress {
						fill: none;
						stroke: var(--progress-color, green);
						stroke-width: ${ProgressRingEl.#RingWidth};
						stroke-dasharray: ${this.#RingCircumference};

						transform-origin: center;
						transform: scaleX(-1) scaleY(-1) rotate(90deg);

						transition: stroke-dashoffset var(--animation-duration, 1s) linear;
					}
					.dot {
						fill: var(--dot-color, green);
						opacity: 1;

						transform-origin: center;
						--opacity-step-position: start;
						transition: transform var(--animation-duration, 1s) linear, opacity var(--animation-duration, 1s) steps(1, var(--opacity-step-position));
					}

					.text {
						font-family: 'Segoe UI', Arial, Verdana, Tahoma, 'Trebuchet MS', sans-serif;
						font-weight: bold;

						font-size: 1.2em;
						@container(width < 80px) {
							font-size: 1.3em;
						}
						@container(width < 60px) {
							font-size: 1.45em;
						}
					}
				}
				&:not([forceAnimate]) {
					@media(prefers-reduced-motion: reduce) {
						--animation-duration: 0s !important;
					}
				}
			}
			#${ProgressRingEl.#ToasterId} {
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

		#IsToastDebouncing;
		#IsToastDebounced;
		#LastToastText;

		#DisplayTextCallback;

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(ProgressRingEl.Name).prototype);
			}
			this.InstanceId = ProgressRingEl.InstanceCount++;

			this.#StyleSheet = new CSSStyleSheet();
			this.#StyleAttribute = `data-${this.getId("style")}`;

			if(!this.#ProgressRingToaster) {
				document.body.insertAdjacentHTML(
					"beforeend",
					`<aside id="${ProgressRingEl.#ToasterId}" aria-live="polite"></aside>`
				);
			}
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

		get Numerator() {
			const floatNumerator = this.FloatNumerator;
			return Math.max(floatNumerator <= this.Denominator ? floatNumerator : this.Denominator, 0);
		}
		get FloatNumerator() {
			const numerator = parseFloat(this.getAttribute("numerator"));
			return isNaN(numerator) ? 0 : numerator;
		}

		get Denominator() {
			const floatDenominator = this.FloatDenominator;
			return Math.max(floatDenominator, 0);
		}
		get FloatDenominator() {
			const denominator = parseFloat(this.getAttribute("denominator"));
			return isNaN(denominator) ? 0 : denominator
		}

		get ProgressRatio() {
			const ratio = this.Numerator / this.Denominator;
			const completeAdjustment = this.Numerator >= this.Denominator ? 1 : 0;
			return isFinite(ratio) ? ratio % 1 + completeAdjustment : 0;
		}

		get ScreenReaderNotificaitonsOn() {
			return !this.hasAttribute("disableSRNotif");
		}

		get #ProgressRingToaster() {
			return document.getElementById(ProgressRingEl.#ToasterId);
		}

		set DisplayTextCallback(value) {
			this.#DisplayTextCallback = value;
			this.#updateState()
		}

		/**
		 * Generates a globally unique ID for a key unique to the custom element instance
		 * @param {String} key Unique key within the custom element
		 * @returns A globally unique ID
		 */
		getId(key) {
			return `${ProgressRingEl.Name}-${this.InstanceId}-${key}`;
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
			delete ProgressRingEl.InstanceMap[this.InstanceId];
		}
		/** Handler invoked when any of the observed attributes are changed */
		attributeChangedCallback() {
			this.#updateState();
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Head.hasAttribute(ProgressRingEl.#CommonStyleAttribute)) {
				this.Head.setAttribute(ProgressRingEl.#CommonStyleAttribute, "");
				this.Root.adoptedStyleSheets.push(ProgressRingEl.#CommonStyleSheet);
			}
			if(!this.Head.hasAttribute(this.#StyleAttribute)) {
				this.Head.setAttribute(this.#StyleAttribute, "");
				this.Root.adoptedStyleSheets.push(this.#StyleSheet);
			}
			this.setAttribute("data-instance", this.InstanceId);

			ProgressRingEl.InstanceMap[this.InstanceId] = this;
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

			this.innerHTML = `
			<svg id="${this.getId("svg")}"
				viewBox="0 0 ${ProgressRingEl.#VbxWidth} ${ProgressRingEl.#VbxHeight}"
				xmlns="http://www.w3.org/2000/svg"
				aria-roledescription="Progress Ring"
			>
				<circle class="base"
					cx="${ProgressRingEl.#VbxWidth / 2}"
					cy="${ProgressRingEl.#VbxHeight / 2}"
					r="${ProgressRingEl.#RingRadius}"
				></circle>
				<circle class="progress"
					cx="${ProgressRingEl.#VbxWidth / 2}"
					cy="${ProgressRingEl.#VbxHeight / 2}"
					r="${ProgressRingEl.#RingRadius}"
				></circle>
				<circle class="dot"
					cx="${ProgressRingEl.#VbxWidth / 2}"
					cy="${ProgressRingEl.#VbxHeight / 2}"
					r="${ProgressRingEl.#DotRadius}"
				></circle>
				<text class="text"
					x="${ProgressRingEl.#VbxWidth / 2}"
					y="${ProgressRingEl.#VbxHeight / 2}"
					dominant-baseline="middle"
					text-anchor="middle"
				></text>
			</svg>`;

			this.IsInitialized = true;

			this.#updateState();
		}

		#updateState() {
			if(!this.IsInitialized) {
				return;
			}
			this.setAttribute("data-progress-ratio", this.ProgressRatio);

			const svgEl = this.getRef("svg");
			svgEl.setAttribute("aria-valuemin", "0");
			svgEl.setAttribute("aria-valuemax", this.Denominator);
			svgEl.setAttribute("aria-valuenow", this.Numerator);
			svgEl.setAttribute("aria-valuetext", this.#getTextContent());
			svgEl.setAttribute("aria-label", this.getAttribute("name"));
			svgEl.setAttribute("role", this.hasAttribute("progressbar") ? "progressbar" : "figure");

			const textEl = svgEl.querySelector(`text`);
			textEl.textContent = this.#getTextContent();

			this.#StyleSheet.replaceSync(`${ProgressRingEl.Name}[data-instance="${this.InstanceId}"] {
				min-width: calc(${textEl.textContent.length}ch + 15px);

				svg {
					.progress {
						stroke-dashoffset: ${ProgressRingEl.#RingCircumference - (this.ProgressRatio * ProgressRingEl.#RingCircumference)};
					}
					.dot {
						transform: rotate(${2 * Math.PI * this.ProgressRatio}rad) translateY(-${ProgressRingEl.#RingRadius}px);
					}
				}
			}`);

			textEl.removeAttribute("textLength");
			const maxTextWidth = (ProgressRingEl.#RingRadius * 2)
				- Math.max(ProgressRingEl.#RingWidth * 2, ProgressRingEl.#DotRadius * 2);
			const textSpaceRatio = maxTextWidth / ProgressRingEl.#VbxWidth;
			if(textEl.getBoundingClientRect().width > (svgEl.getBoundingClientRect().width * textSpaceRatio)) {
				textEl.setAttribute("textLength", maxTextWidth);
			}

			this.#toastUpdate();
		}

		#getTextContent() {
			if(this.#DisplayTextCallback) {
				return this.#DisplayTextCallback({
					Numerator: this.Numerator,
					Denominator: this.Denominator,
					FloatNumerator: this.FloatNumerator,
					FloatDenominator: this.FloatDenominator
				});
			}
			if(this.hasAttribute("percent")) {
				return `${Math.round(this.ProgressRatio*100)}%`;
			}
			return `${this.Numerator}/${this.Denominator}`;
		}

		#toastUpdate() {
			if(!this.ScreenReaderNotificaitonsOn) {
				return;
			}

			if(this.#LastToastText === this.#getTextContent()) {
				return;
			}
			if(this.#IsToastDebouncing) {
				this.#IsToastDebounced = true;
				return;
			}

			this.#ProgressRingToaster.insertAdjacentHTML(
				"afterbegin",
				`<article id="${this.getId("toast")}">
					${this.getAttribute("name")} Progress Ring Updated: ${this.#getTextContent()}
				</article>`
			);
			this.#LastToastText = this.#getTextContent();

			this.#IsToastDebouncing = true;
			setTimeout(() => {
				this.#IsToastDebouncing = false;
				document.getElementById(this.getId("toast"))?.remove();
				if(this.#IsToastDebounced) {
					this.#IsToastDebounced = false;
					this.#toastUpdate();
				}
			}, 2000);
		}
	}
	if(!customElements.get(ns.ProgressRingEl.Name)) {
		customElements.define(ns.ProgressRingEl.Name, ns.ProgressRingEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.ProgressRingEl");