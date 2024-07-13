/**
 * @file Scripts for the submenu control
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
(function Controls(ns) {
	ns.SubmenuEl = class SubmenuEl extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		groupIdentifier;

		//#region element properties
		buttonEl;
		submenuContentEl;
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = SubmenuEl.instanceCount++;

			if(this.instanceId === 0) {
				document.head.insertAdjacentHTML("beforeend",`
				<style>
					.gw-submenu-hidden {
						display: none !important;
					}
				</style>
				`);
			}
		}

		connectedCallback() {
			this.groupIdentifier = this.getAttribute("group") || "";
			SubmenuEl.instanceMap[this.groupIdentifier] = SubmenuEl.instanceMap[this.groupIdentifier] || [];
			SubmenuEl.instanceMap[this.groupIdentifier].push(this);

			if(document.readyState === "complete") {
				this.onRenderReady();
			}
			else {
				window.addEventListener("load", this.onRenderReady);
			}
		}

		onRenderReady = () => {
			this.buttonEl = document.getElementById(this.getAttribute("button"));
			this.submenuContentEl = document.getElementById(this.getAttribute("content"));

			this.renderContent();

			this.registerHandlers();
		};

		renderContent() {
			if(!this.buttonEl || !this.submenuContentEl) { return; }

			this.buttonEl.setAttribute("aria-controls", this.submenuContentEl.id);
			this.buttonEl.classList.add("submenu-button");
			if(!this.buttonEl.hasAttribute("aria-expanded")) {
				this.buttonEl.setAttribute("aria-expanded", false);
			}

			if(this.buttonEl.getAttribute("aria-expanded") !== "true") {
				this.submenuContentEl.classList.add("gw-submenu-hidden");
			}
			this.submenuContentEl.classList.add("submenu");
		}

		show() {
			this.buttonEl.setAttribute("aria-expanded", "true");
			this.submenuContentEl.classList.remove("gw-submenu-hidden");
		}

		hide() {
			this.buttonEl.setAttribute("aria-expanded", "false");
			this.submenuContentEl.classList.add("gw-submenu-hidden");
		}

		//#region Handlers
		registerHandlers() {
			this.buttonEl.addEventListener("click", this.onSubmenuClick);
		}

		onSubmenuClick = (_event) => {
			if(this.buttonEl.getAttribute("aria-expanded") !== "true") {
				SubmenuEl.instanceMap[this.groupIdentifier].forEach(submenuEl => {
					if(submenuEl.instanceId !== this.instanceId) {
						submenuEl.hide();
					}
					else {
						submenuEl.show();
					}
				});
			}
			else {
				this.hide();
			}
		};
		//#endregion
	};
	customElements.define("gw-submenu", ns.SubmenuEl);
}) (window.GW.Controls = window.GW.Controls || {});