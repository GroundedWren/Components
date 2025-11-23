/**
 * @file Tablist control
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Controls(ns) {
	ns.TablistEl = class TablistEl extends HTMLElement {
		static InstanceCount = 0;

		InstanceId;
		IsInitialized;
		IdIdx = 0;

		constructor() {
			super();
			this.InstanceId = TablistEl.InstanceCount++;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					gw-tablist {
						.radio {
							width: 16px;
							height: 16px;
							margin-inline: 3px;
							path {
								fill: var(--icon-color, #000000);
							}
						}
						[role="tab"][aria-selected="true"] {
							background-color: var(--selected-color, #90CBDB);
						}
					}	
				</style>`);
			}
		}

		getId(key) {
			return `gw-tablist-${this.InstanceId}-${key}`;
		}
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		get TabAry() {
			return Array.from(this.querySelectorAll("button"));
		}
		get FieldsetEl() {
			return this.querySelector("fieldset");
		}
		get LegendEl() {
			return this.querySelector("legend");
		}

		connectedCallback() {
			if(!this.IsInitialized) {
				if(document.readyState === "loading") {
					document.addEventListener("DOMContentLoaded", () => {
						if(!this.IsInitialized) {
							this.renderContent();
						}						
					});
				}
				else {
					this.renderContent();
				}
			}
		}

		renderContent() {
			this.FieldsetEl.setAttribute("role", "tablist");

			if(this.LegendEl) {
				this.LegendEl.setAttribute("id", this.LegendEl.id || this.getId("legend"));
				this.FieldsetEl.setAttribute("aria-labelledby", this.LegendEl.id);
			}

			let hasSelected = false;
			const displaySelectorLines = [];
			this.TabAry.forEach(tabEl => {
				tabEl.setAttribute("role", "tab");
				tabEl.id = tabEl.id || this.getId(`tab-${this.IdIdx++}`);

				const isSelected = !hasSelected && tabEl.getAttribute("aria-selected") === "true";
				tabEl.setAttribute("aria-selected", isSelected ? "true" : "false");
				tabEl.setAttribute("tabindex", isSelected ? "0" : "-1");

				tabEl.insertAdjacentHTML("afterbegin", `<div class="radio" aria-hidden="true"></div>`);
				this.updateIcon(tabEl);

				tabEl.addEventListener("keydown", this.onTabKeydown);
				tabEl.addEventListener("click", this.onTabClick);

				const panelId = tabEl.getAttribute("aria-controls");
				const panelEl = document.getElementById(panelId);
				Object.entries({
					"role": "tabpanel",
					"aria-labelledby": tabEl.id
				}).forEach(([attribute, value]) => panelEl.setAttribute(attribute, value));
				displaySelectorLines.push(`&:has([aria-controls="${panelId}"][aria-selected="false"]) #${panelId}`);
			});

			if(!hasSelected) {
				this.querySelector("button").setAttribute("tabindex", "0");
			}

			const containerId = this.getAttribute("container");
			this.insertAdjacentHTML("afterbegin", `<style>
				${containerId ? `#${containerId}` : "body"} {
					${displaySelectorLines.join(", ")} {
						display: none;
					}
				}
			</style>`);

			this.IsInitialized = true;
		}

		onTabKeydown = (event) => {
			const tabEl = event.target;
			let newTab = null;
			switch(event.key) {
				case "ArrowRight":
				case "ArrowDown":
					newTab = tabEl.nextElementSibling;
					break;
				case "ArrowLeft":
				case "ArrowUp":
					newTab = tabEl.previousElementSibling;
					break;
				case "Home":
					newTab = this.querySelector("button:first-of-type");
					break;
				case "End":
					newTab = this.querySelector("button:last-of-type");
					break;
			}
			if(newTab) {
				event.preventDefault();
				newTab.click();
				newTab.focus();
			}
		};

		onTabClick = (event) => {
			const lastSelTab = this.querySelector(`[aria-selected="true"]`);
			const canUnselect = this.hasAttribute("unselectable");

			const clickedTab = event.currentTarget;
			this.TabAry.forEach(tabEl => {
				tabEl.setAttribute("aria-selected", (tabEl === clickedTab) && (!canUnselect || tabEl !== lastSelTab));
				tabEl.setAttribute("tabindex", tabEl === clickedTab ? "0" : "-1");
				this.updateIcon(tabEl);
			});
			if(lastSelTab !== this.querySelector(`[aria-selected="true"]`)) {
				this.dispatchEvent(new Event("tab-change"));
			}
		};

		updateIcon(tabEl) {
			const isSelected = tabEl.getAttribute("aria-selected") === "true";
			tabEl.querySelector(".radio").innerHTML = isSelected
				? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256-96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>`
				: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>`;
		}
	}
	customElements.define("gw-tablist", ns.TablistEl);
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.Tablist");