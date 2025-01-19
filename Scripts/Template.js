/**
 * @file Web component template
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function TEMPLATE(ns) {
	ns.TEMPLATEEl = class TEMPLATEEl extends HTMLElement {
		static InstanceCount = 0;

		InstanceId;
		IsInitialized;

		constructor() {
			super();
			this.InstanceId = TEMPLATEEl.InstanceCount++;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					gw-TEMPLATE {
					}	
				</style>`);
			}
		}

		getId(key) {
			return `gw-TEMPLATE-${this.InstanceId}-${key}`;
		}
		getRef(key) {
			return this.querySelector(`#${this.getId(key)}`);
		}

		get TestEl() {
			return this.getRef("test");
		}

		connectedCallback() {
			if(!this.IsInitialized) {
				const observer = new MutationObserver((_mutationList, _observer) => {});
				observer.observe(this, {attributes: true, childList: false, subtree: false});

				if(document.readyState === "loading") {
					document.addEventListener("DOMContentLoaded", this.renderContent);
				}
				else {
					this.renderContent();
				}
			}
		}

		renderContent = () => {
			this.innerHTML = `
			`;

			this.IsInitialized = true;
		};
	}
	customElements.define("gw-TEMPLATE", ns.TEMPLATEEl);
}) (window.GW.Controls.TEMPLATE = window.GW.Controls.TEMPLATE || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.TEMPLATE");