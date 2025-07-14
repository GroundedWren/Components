/**
 * @file A web component to show tooltips
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
(function Controls(ns) {
	/**
	 * <gw-tooltip></gw-tooltip>
	 * 
	 * A custom element for showing WCAG 1.4.13 conformant tooltips which may be interactive.
	 * 
	 * Attributes:
	 * 	{"top" | "bottom" | "left" | "right"} [preferredPos="bottom"]  The orientation of the tooltip contingent on available space
	 * 	{number} [showDelay=0] Miliseconds after hover and focus the tooltip waits to appear
	 * 	{number} [hideDelay=500] Miliseconds after losing hover and focus the tooltip waits to vanish
	 * 
	 * Required child elements:
	 * 	An element with class="tool". This is the visible element that will trigger the tooltip.
	 * 	An element with class="tip". This is the hidden element which appears on hover or focus. It will have its role set to "region".
	 * 
	 * This doesn't use the Shadow DOM, but there are still CSS Variables to alter appearance without modifying the CSS here directly.
	 * CSS Variables:
	 * 	[--border-color="black"] The color of the border on elements which have a tooltip.
	 * 	[--focus-color="red"] The outline color given to elements with tooltips when they receive focus.
	 * 	[--background-color	="white"] The background color of the tooltip elements.
	 * 	[--text-color="black"] The color of text in the tooltip element.
	 * 	[--mark-color="#FCC5F1"] The background color given to elements with a tooltip when their tooltip is showing.
	 */
	ns.TooltipEl = class TooltipEl extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		static liveEl = null;
		//#endregion

		//#region instance properties
		instanceId;
		isInitialized;
		toolEl;
		tipEl;
		preferredPos;
		showDelay;
		showTimeout;
		hideDelay;
		hideTimeout;
		announceIdx;
		forcedHidden;
		//#endregion

		constructor() {
			super();
			this.instanceId = TooltipEl.instanceCount++;
			TooltipEl.instanceMap[this.instanceId] = this;

			this.announceIdx = 0;

			if(this.instanceId === 0) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					gw-tooltip {
						display: inline-block;
						position: relative;
						width: fit-content;
						height: fit-content;

						.tool {
							outline: 1px dashed var(--border-color, black);
							outline-offset: 1px;
							
							&:focus {
								outline-width: 4px;
								outline-color: var(--focus-color, red);
								outline-style: solid;
								outline-offset: 1px;
								
								position: relative;
								z-index: 100 !important;
							}
						}

						.tip {
							background-color: var(--background-color, white);
							color: var(--text-color, black);
							border: 2px solid var(--border-color, black);

							display: none;
							position: absolute;

							width: max-content;

							&.right {
								top: -50%;
								left: 100%;
							}
							
							&.top {
								bottom: 100%;
								left: 0;
							}

							&.left {
								top: -50%;
								right: 100%;
							}

							&.bottom {
								top: auto;
								left: 0;
								right: auto;
								bottom: auto;
							}
						}
						
						&.shown {
							.tool {
								background-color: var(--mark-color, #FCC5F1);
							}

							.tip {
								display: block;
								z-index: 2;
								padding: 5px;
							}
						}
					}
					
					#asiGWTooltipsLive {
						position: absolute;
						left: -99999999px;
						top: 0px;
					}
					
					#GWTooltipsGroupLabel, #GWTooltipsRegionLabel {
						display: none;
					}
				</style>
				`);

				document.body.insertAdjacentHTML("beforeend", `<aside id="asiGWTooltipsLive" aria-live="polite"></aside>`)
				TooltipEl.liveEl = document.getElementById("asiGWTooltipsLive");

				document.body.insertAdjacentHTML("beforeend", `<span id="GWTooltipsGroupLabel">Has tooltip on hover or focus</span>`);
				document.body.insertAdjacentHTML("beforeend", `<span id="GWTooltipsRegionLabel">Tooltip</span>`);
			}
		}

		/**
		 * A unique descriptor for this particular element
		 */
		get idKey() {
			return `gw-tooltip-${this.instanceId}`;
		}

		/**
		 * Setup which may be performed before the document is loaded
		 */
		connectedCallback() {
			if (this.isInitialized) { return; }

			this.showDelay = parseInt(this.getAttribute("showDelay")) || 0;
			this.hideDelay = parseInt(this.getAttribute("hideDelay"));
			if(isNaN(this.hideDelay)) {
				this.hideDelay = 500;
			}
			this.preferredPos = (this.getAttribute("preferredPos") || "").toLowerCase();
			if(["top", "bottom", "left", "right"].indexOf(this.preferredPos) < 0) {
				this.preferredPos = "bottom";
			}

			this.isInitialized = true;
			
			if(document.readyState === 'complete') {
				this.doSetup();
			}
			else {
				window.addEventListener("load", this.doSetup);
			}
		}

		/**
		 * Setup which must be performed after the document is loaded
		 */
		doSetup = () => {
			this.setAttribute("role", "group");
			this.setAttribute("aria-labelledby", "GWTooltipsGroupLabel");

			this.toolEl = Array.from(this.getElementsByClassName("tool"))[0];
			if(!this.toolEl) {
				debugger; // A "tool" class child element is required
				return;
			}
			this.toolEl.id = this.toolEl.id || `${this.idKey}-tool`;

			this.tipEl = Array.from(this.getElementsByClassName("tip"))[0];
			if(!this.tipEl) {
				debugger; // A "tip" class child element is required
				return;
			}
			
			this.tipEl.id = this.tipEl.id || `${this.idKey}-tip`;
			this.tipEl.setAttribute("role", "region");
			this.tipEl.setAttribute("aria-labelledby", "GWTooltipsRegionLabel");

			this.toolEl.setAttribute("aria-details", this.tipEl.id);

			if(!this.toolEl.hasAttribute("tabindex")) {
				this.toolEl.setAttribute("tabindex", 0);
			}

			this.addEventListener("focusout", this.onInteract);
			this.addEventListener("focusin", this.onInteract);
			this.addEventListener("mouseenter", this.onInteract);
			this.addEventListener("mouseout", this.onInteract);

			// Soft dismiss
			document.addEventListener("keydown", (event) => {
				switch (event.key) {
					case 'Escape':
					case 'Backspace':
						if(this.classList.contains("shown")) {
							this.forcedHidden = true;
							if(this.matches(":focus-within") && this.toolEl.getAttribute("tabindex") !== "-1") {
								this.toolEl.focus();
							}
							setTimeout(this.doHide, 0);
							event.preventDefault();
						}
						break;
					case 'F1':
						if(this.toolEl.matches(":focus-within") && !this.classList.contains("shown")) {
							event.preventDefault();
							this.forcedHidden = false;
							setTimeout(this.doShow, 0);
						}
						break;
				}
			});

			this.insertBefore(this.toolEl, this.tipEl);
		};

		/**
		 * Processes interactions which may show or hide the tooltip
		 * @returns {Promise<void>}
		 */
		onInteract = async (event) => {
			let timeoutResolveFn
			const timeoutPromise = new Promise(resolve => timeoutResolveFn = resolve);
			setTimeout(timeoutResolveFn, 0);
			await timeoutPromise; //Make sure whether we're focused or hovered is up to date

			if(this.shouldShow()) {
				if(this.classList.contains("shown") || event.type === "mouseout" || event.type === "focusout") {
					return;
				}
				this.showTimeout = setTimeout(this.doShow, this.showDelay);
				clearTimeout(this.hideTimeout);
			}
			else {
				if(!this.classList.contains("shown") || event.type === "mousein" || event.type === "focusin") {
					return;
				}
				this.hideTimeout = setTimeout(this.doHide, this.hideDelay);
				clearTimeout(this.showTimeout);
			}
		};

		/**
		 * Shows and positions the tooltip, if still appropriate
		 */
		doShow = () => {
			if(!this.shouldShow()) { return; }
			this.classList.add("shown");
			this.announce("Tooltip shown.");
			
			this.setPosition();
		};

		/**
		 * Tries to find a position such that the tooltip isn't cut off.
		 */
		setPosition() {
			this.tipEl.classList.remove("bottom", "top", "right", "left");
			let positions = ["bottom", "top", "right", "left"];
			let curPos = this.preferredPos;
			let foundSuitable = false;

			while(positions.length && !foundSuitable) {
				let idx = positions.indexOf(curPos);
				positions.splice(idx, 1);

				this.tipEl.classList.add(curPos);
				const boundingRect = this.tipEl.getBoundingClientRect();
				if(boundingRect.bottom <= window.innerHeight
					&& boundingRect.top >= 0
					&& boundingRect.right <= window.innerWidth
					&& boundingRect.left >= 0
				) {
					foundSuitable = true;
				}
				else {
					this.tipEl.classList.remove(curPos);
					curPos = positions[0];
				}
			}
		}

		/**
		 * Hides the tooltip if still appropriate
		 */
		doHide = () => {
			if(this.shouldShow()) { return; }
			if(this.forcedHidden) {
				setTimeout(() => {this.forcedHidden = false;}, this.showDelay);
			}

			this.classList.remove("shown");
			this.announce("Tooltip hidden."
				+ (this.forcedHidden && this.toolEl.matches(":focus-within") ? " Press F1 to show." : "")
			);
		};

		/**
		 * @returns {boolean} Whether it's appropriate for the tooltip to be showing at the current moment
		 */
		shouldShow() {
			return !this.forcedHidden && this.matches(":focus-within, :hover");
		}

		/**
		 * Creates an assistive-tech only alert
		 * @param {string} text Information to provide to assistive tech
		 */
		announce(text) {
			this.announceIdx++;
			const announceKey = `${this.idKey}-announce-${this.announceIdx}`;
			TooltipEl.liveEl.insertAdjacentHTML("beforeend", `<span id="${announceKey}">${text}</span>`);
			setTimeout((announceKey) => {
				document.getElementById(announceKey).remove();
			}, 1000, announceKey);
		}
	};
	customElements.define("gw-tooltip", ns.TooltipEl);
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.TooltipEl");