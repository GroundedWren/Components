/**
 * @file Control for a listbox of checkboxes
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function CheckListbox(ns) {
	ns.CheckListboxEl = class CheckListboxEl extends HTMLElement {
		static InstanceCount = 0;
		static ResetMs = 500;

		InstanceId;
		IsInitialized;
		IdIter = 0;
		KeyMap = {};
		CurKeySequence = [];
		LastKeyTimestamp = new Date(-8640000000000000); //Earliest representable date

		constructor() {
			super();
			this.InstanceId = CheckListboxEl.InstanceCount++;

			if(this.InstanceId === 0) {
				document.head.insertAdjacentHTML("beforeend", `
				<style>
					gw-check-listbox {
						.selsDesc {
							display: none;
						}
						
						fieldset {
							border-color: var(--link-color, #0000EE);
							background-color: var(--button-face-color, #C8C8C8);

							legend {
								background-color: var(--button-face-color, #C8C8C8);
								border-radius: 20px;
								display: flex;
								align-items: center;
								gap: 2px;

								> svg {
									width: 1em;
									height: 1em;
								}
							}
						}	
					}
				</style>`);
			}
		}

		getId(key) {
			return `gw-check-listbox-${this.InstanceId}-${key}`;
		}
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		get FieldsetEl() {
			return this.querySelector("fieldset");
		}

		get LegendEl() {
			return this.querySelector("legend");
		}

		get SelDescEl() {
			return this.querySelector(".selsDesc");
		}

		get LabelElAry() {
			return [...this.querySelectorAll("label")];
		}

		get ActiveDescendant() {
			return this.FieldsetEl.getAttribute("aria-activedescendant");
		}
		set ActiveDescendant(value) {
			if(value) {
				this.FieldsetEl.setAttribute("aria-activedescendant", value);
			}
			else {
				this.FieldsetEl.removeAttribute("aria-activedescendant");
			}
		}

		get Value() {
			return [...this.querySelectorAll(`input:checked`)].map(inputEl => inputEl.value);
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

		/**
		 * Sets up the state and interactivity of the listbox.
		 */
		renderContent () {
			Object.entries({
				"role": "listbox",
				"aria-multiselectable": "true",
			}).forEach(
				([attribute, value]) => this.FieldsetEl.setAttribute(attribute, value)
			);
			this.ActiveDescendant = null;
			this.KeyMap = {};

			if(!this.LegendEl.hasAttribute("data-checklistbox-has-icon")) {
				this.LegendEl.insertAdjacentHTML(
					"beforeend",
					`<svg viewBox="0 0 576 512" class="gw-icon" aria-hidden="true"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><title>Use arrow keys or type an option to navigate.</title><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm16 64h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM64 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16zm80-176c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V144zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V240c0-8.8 7.2-16 16-16zM160 336c0-8.8 7.2-16 16-16H400c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V336zM272 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM256 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V240zM368 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM352 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V240zM464 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM448 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16z"></path></svg>`
				);
				this.LegendEl.setAttribute("data-checklistbox-has-icon", "true");
			}

			if(!this.SelDescEl) {
				this.insertAdjacentHTML("afterbegin", `<aside id="${this.getId("selsDesc")}" class="selsDesc"></aside>`);
				this.FieldsetEl.setAttribute(
					"aria-describedby",
					[this.FieldsetEl.getAttribute("aria-describedby"), this.getId("selsDesc")].filter(id => !!id).join(" ")
				);
			}
			
			let hasChecked = false;
			this.LabelElAry.forEach(labelEl => {
				if(!labelEl.hasAttribute("data-checklistbox-listening")) {
					labelEl.addEventListener("click", this.onOptionClick);
					labelEl.addEventListener("keydown", this.onOptionKeydown);
					labelEl.addEventListener("keyup", this.onOptionKeyup);
					labelEl.setAttribute("data-checklistbox-listening", "true");
				}
				const inputEl = labelEl.querySelector("input");
				Object.entries({
					"aria-hidden": "true",
					"tab-index": "-1",
					"inert": "true"
				}).forEach(
					([attribute, value]) => inputEl.setAttribute(attribute, value)
				);

				this.#overwriteInputChecked(labelEl, inputEl);
				this.#overwriteInputClick(labelEl, inputEl);

				Object.entries({
					"id": labelEl.id || this.getId(this.IdIter++),
					"role": "option",
					"tabindex": "-1",
					"aria-selected": inputEl.checked
				}).forEach(
					([attribute, value]) => labelEl.setAttribute(attribute, value)
				);

				this.addToKeyMap(labelEl.innerText.trim().toLowerCase(), labelEl);

				if(!this.ActiveDescendant || (!hasChecked && inputEl.checked)) {
					if(inputEl.checked) {
						hasChecked = true;
					}
					this.setActiveOption(labelEl);
				}
				
				this.updateSelsDesc();
			});

			if(!this.IsInitialized) {
				new MutationObserver(this.#onMutation).observe(
					this,
					{childList: true, subtree: true}
				);
			}
			this.IsInitialized = true;
		};

		#onMutation = (mutationList) => {
			if(mutationList.filter(mutation => mutation.target.id !== this.getId("selsDesc")).length) {
				this.renderContent();
			}
		}

		/**
		 * Enables an option for type-ahead functionality
		 * @param {string} text Option's text
		 * @param {HTMLElement} optionEl Option element
		 */
		addToKeyMap(text, optionEl) {
			let currentLevel = this.KeyMap;
			text.split("").forEach(character => {
				currentLevel[character] = currentLevel[character] || {};
				currentLevel = currentLevel[character];
				(currentLevel.OptionElAry = currentLevel.OptionElAry || []).push(optionEl);
			});
		}

		onOptionClick = (event) => {
			const optionEl = event.target;
			if(!optionEl.matches(`[role="option"]`)) {
				return;
			}

			optionEl.setAttribute("aria-selected", optionEl.getAttribute("aria-selected") !== "true");
			this.updateSelsDesc();
			this.setActiveOption(optionEl);
			setTimeout(() => this.dispatchEvent(new Event("option-click")), 0);
		};

		onOptionKeydown = (event) => {
			let newOptionEl = null;

			switch(event.key) {
				case "ArrowRight":
				case "ArrowDown":
					newOptionEl = this.getAdjacentOption(event.target, "nextElementSibling");
					break;
				case "ArrowLeft":
				case "ArrowUp":
					newOptionEl = this.getAdjacentOption(event.target, "previousElementSibling");
					break;
				case "Home":
					newOptionEl = this.querySelector(`[role="option"]:first-of-type`);
					break;
				case "End":
					newOptionEl = this.querySelector(`[role="option"]:last-of-type`);
					break;
				case "Enter":
					this.onOptionClick(event);
					return;
				case " ":
					event.preventDefault();
					return;
				default:
					newOptionEl = this.getFirstMatch(event.key.toLowerCase());
					break;
			}
			if(newOptionEl) {
				event.preventDefault();
				this.setActiveOption(newOptionEl);
			}
		};

		/**
		 * Finds the next adjacent option using the specified access attribute
		 * @param {HTMLElement} optionEl The current option to search from
		 * @param {string} accessAttrName "nextElementSibling" or "previousElementSibling"
		 * @returns The next adjacent option, if it exists
		 */
		getAdjacentOption(optionEl, accessAttrName) {
			let curEl = optionEl;
			do {
				curEl = curEl[accessAttrName];
			} while(curEl && !curEl.matches(`[role="option"]`));
			
			return curEl;
		}

		onOptionKeyup = (event) => {
			switch(event.key) {
				case " ":
					this.onOptionClick(event);
					event.preventDefault();
					break;
			}
		};

		/**
		 * Finds a type-ahead match
		 * @param {string} key Latest typed character
		 * @returns {HTMLElement | null} Option element match
		 */
		getFirstMatch(key) {
			const keyTimestamp = new Date();
			if(keyTimestamp - this.LastKeyTimestamp > CheckListboxEl.ResetMs) {
				this.CurKeySequence = [];
			}
			this.LastKeyTimestamp = keyTimestamp;

			this.CurKeySequence.push(key);

			let sequenceObj = this.KeyMap;
			this.CurKeySequence.forEach(key => sequenceObj = sequenceObj[key] || {});

			if(!sequenceObj.OptionElAry) {
				if(this.KeyMap[key]?.OptionElAry) {
					this.CurKeySequence = [key];
					sequenceObj = this.KeyMap[key];
				}
				else {
					this.CurKeySequence = [];
					return null;
				}
			}

			return sequenceObj.OptionElAry[0];
		}

		/**
		 * Updates what the active option is
		 * @param {HTMLElement} inputEl The newly active option
		 */
		setActiveOption(optionEl) {
			if(this.ActiveDescendant) {
				this.querySelector(`#${this.ActiveDescendant}`).setAttribute("tabindex", "-1");
			}
			optionEl.setAttribute("tabindex", "0");
			if(this.IsInitialized && this.matches(`:focus-within`)) {
				optionEl.focus();
			}
			setTimeout(() => {
				if(optionEl.querySelector("input").checked !== (optionEl.getAttribute("aria-selected") === "true")) {
					optionEl.querySelector("input").click();
				}
			}, 0);
			this.ActiveDescendant = optionEl.id;
		}

		updateSelsDesc() {
			const selectionsList = this.LabelElAry.filter(
				label => label.getAttribute("aria-selected") === "true"
			).map(label => label.innerText).join(", ");

			const oldSelDesc = this.SelDescEl.innerHTML;
			this.SelDescEl.innerHTML = selectionsList ? `Selections: ${selectionsList}` : "No selections";

			if(oldSelDesc && this.SelDescEl.innerHTML !== oldSelDesc) {
				setTimeout(() => this.dispatchEvent(new Event("selection-change")), 0);
			}
		}

		#overwriteInputChecked(labelEl, inputEl) {
			const checkedDescriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(inputEl),
				"checked"
			);
			const originalSet = checkedDescriptor.set;
			checkedDescriptor.set = this.#createDelegate(
				inputEl,
				function(checkedDescriptor, labelEl, customHandler, originalSet, value) {
					customHandler(labelEl, value);

					const newSet = checkedDescriptor.set;
					checkedDescriptor.set = originalSet;
					Object.defineProperty(this, "checked", checkedDescriptor);

					this.checked = value;

					checkedDescriptor.set = newSet;
					Object.defineProperty(this, "checked", checkedDescriptor);
				},
				[checkedDescriptor, labelEl, this.#customInputChecked, originalSet]
			);
			Object.defineProperty(inputEl, "checked", checkedDescriptor);
		}
		#customInputChecked = (labelEl, value) => {
			labelEl.setAttribute("aria-selected", value ? "true" : "false");
			this.updateSelsDesc();
		}

		#overwriteInputClick(labelEl, inputEl) {
			const clickDescriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(Object.getPrototypeOf(inputEl)),
				"click"
			);

			const originalClick = clickDescriptor.value;
			clickDescriptor.value = this.#createDelegate(
				inputEl,
				function(clickDescriptor, labelEl, customHandler, originalClick) {
					const newClick = clickDescriptor.value;
					clickDescriptor.value = originalClick;
					Object.defineProperty(this, "click", clickDescriptor);

					this.click();

					clickDescriptor.value = newClick;
					Object.defineProperty(this, "click", clickDescriptor);

					customHandler(labelEl);
				},
				[clickDescriptor, labelEl, this.#customInputClick, originalClick]
			);
			Object.defineProperty(inputEl, "click", clickDescriptor);
		}
		#customInputClick = (labelEl) => {
			labelEl.setAttribute("aria-selected", labelEl.querySelector(`input`).checked ? "true" : "false");
			this.updateSelsDesc();
		};

		#createDelegate = function(context, method, args) {
			return function generatedFunction() {
				return method.apply(context, (args || []).concat(...arguments));
			}
		}
	}
	customElements.define("gw-check-listbox", ns.CheckListboxEl);
}) (window.GW.Controls.CheckListbox = window.GW.Controls.CheckListbox || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.CheckListbox");