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

		buttonEl;
		submenuContentEl;
		detailsEl;
		//#endregion

		constructor() {
			super();
			this.instanceId = SubmenuEl.instanceCount++;
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
			this.detailsEl = document.getElementById(this.getAttribute("details"));

			this.renderContent();

			this.registerHandlers();
		};

		renderContent() {
			if(this.buttonEl && this.submenuContentEl) {
				this.buttonEl.setAttribute("aria-controls", this.submenuContentEl.id);
				this.buttonEl.classList.add("submenu-button");
				if(!this.buttonEl.hasAttribute("aria-expanded")) {
					this.buttonEl.setAttribute("aria-expanded", false);
				}
				
				if(this.buttonEl.getAttribute("aria-expanded") !== "true") {
					this.submenuContentEl.setAttribute("hidden", "true");
				}
				this.submenuContentEl.classList.add("submenu");
			}
		}

		show() {
			this.buttonEl?.setAttribute("aria-expanded", "true");
			this.submenuContentEl?.removeAttribute("hidden");
			this.detailsEl?.setAttribute("open", "true");
		}

		hide() {
			this.buttonEl?.setAttribute("aria-expanded", "false");
			this.submenuContentEl?.setAttribute("hidden", "true");
			this.detailsEl?.removeAttribute("open");
		}

		//#region Handlers
		registerHandlers() {
			this.buttonEl?.addEventListener("click", this.onSubmenuClick);
			if(this.detailsEl) {
			  const summary = Array.from(this.detailsEl.getElementsByTagName("summary"))[0];
			  summary?.addEventListener("click", this.onSubmenuClick);
			}
		}

		onSubmenuClick = (event) => {
			if((this.buttonEl && this.buttonEl.getAttribute("aria-expanded") !== "true")
			  || (this.detailsEl && !this.detailsEl.hasAttribute("open"))
			) {
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
			event.preventDefault();
		};
		//#endregion
	};
	customElements.define("gw-submenu", ns.SubmenuEl);
}) (window.GW.Controls = window.GW.Controls || {});