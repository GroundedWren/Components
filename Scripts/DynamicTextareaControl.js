/**
 * @file Control for textareas which have dynamic tabbing behavior
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Controls(ns) {
	ns.DynamicTextareaEl = class DynamicTextareaEl extends HTMLElement {
		static InstanceCount = 0;
		static InstanceMap = {};
		static EditorMode = false;
		static Name = "gw-dynamic-textarea";
		static Style = `${DynamicTextareaEl.Name} {
			position: relative;
			z-index: 0;
			box-sizing: border-box;
			display: flex;
			width: fit-content;
			overflow: clip;

			[id$="asiInstruct"] {
				display: none;
			}

			label.mode-toggle {
				user-select: none;
				cursor: pointer;

				position: absolute;
				top: 0;
				right: 2ch;
				z-index: 999;

				display: grid;
				grid-auto-flow: column;
				gap: 2px;
				align-items: center;
				min-height: 24px;
				min-width: 24px;
				justify-content: end;

				margin: 3px;

				background-color: var(--background-color-2, #F2F2F2);
				svg {
					align-self: center;
					width: 0.8em;
					aspect-ratio: 1 / 1;
					padding: 1px;

					path {
						fill: var(--icon-color);
					}

					&.checked {
						display: none;
					}
					&.not-checked {
						display: block;
					}
				}
				&.checked {
					background-color: var(--selected-color, #90CBDB);
					svg {
						&.checked {
							display: block;
						}
						&.not-checked {
							display: none;
						}
					}
				}
				span:has(> kbd) {
					display: inline-flex;
					align-items: baseline;
					kbd {
						display: inline-block;
					}
				}
			}

			.lang {
				color: #FFFFFF;
				font-style: italic;
				position: absolute;
				top: 0;
				min-height: 18px;
				display: flex;
				align-items: center;
				margin-inline: 3px;
				margin-block: 6px;
				background-color: #000000;
				padding-inline: 1ch;
				border-radius: 20px;
				opacity: 0;
			}

			textarea, code {
				margin: 0;
				padding-inline: 2px;
				padding-block-start: max(26px, 1.4rem);
				min-width: 22ch;
				min-height: 10ex;
				font-family: monospace;
				font-size: medium;
				word-break: break-all;
				border-width: 2px;
				border-style: groove;
			}
			code {
				position: absolute;
				z-index: -1;
				opacity: 0;
				color: #FFFFFF;
				user-select: none;
				white-space: pre-wrap;
				border-color: transparent;
			}
			textarea {
				scrollbar-width: none;
			}
			
			&[data-language] {
				background-color: #2d2d2d;
				textarea {
					min-width: 30ch;
					color: transparent;
					background-color: transparent;
					caret-color: #FFFFFF;
				}
				code, .lang {
					opacity: initial;
				}
				label.mode-toggle {
					background-color: #000000;
					color: #FFFFFF;

					&.checked {
						background-color: #223891;
						color: #FFFFFF;
					}
					svg path {
						fill: #FFFFFF;
					}
				}
			}

			&:not(:focus-within, :hover) {
				label.mode-toggle {
					display: none;
				}
			}
		}
		[dir="rtl"] ${DynamicTextareaEl.Name} label.mode-toggle {
			left: 2ch;
			right: auto;
		}
		`;
		
		static PrismStyle = `${DynamicTextareaEl.Name} {
			/*
			*	This is the Prism "Tomorrow Night" theme. See: https://github.com/PrismJS/prism/blob/master/themes/prism-tomorrow.min.css
			*
			*	MIT LICENSE
			*	Copyright (c) 2012 Lea Verou
			*
			*	Permission is hereby granted, free of charge, to any person obtaining a copy
			*	of this software and associated documentation files (the "Software"), to deal
			*	in the Software without restriction, including without limitation the rights
			*	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
			*	copies of the Software, and to permit persons to whom the Software is
			*	furnished to do so, subject to the following conditions:
			*
			*	The above copyright notice and this permission notice shall be included in
			*	all copies or substantial portions of the Software.
			*
			*	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
			*	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
			*	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
			*	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
			*	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
			*	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
			*	THE SOFTWARE.
			*/
			.token.block-comment,.token.cdata,.token.comment,.token.doctype,.token.prolog{
				color:#999;
			}
			.token.punctuation{
				color:#ccc;
			}
			.token.attr-name,.token.deleted,.token.namespace,.token.tag{
				color:#e2777a;
			}
			.token.function-name{
				color:#6196cc;
			}
			.token.boolean,.token.function,.token.number{
				color:#f08d49;
			}
			.token.class-name,.token.constant,.token.property,.token.symbol{
				color:#f8c555;
			}
			.token.atrule,.token.builtin,.token.important,.token.keyword,.token.selector{
				color:#cc99cd;
			}
			.token.attr-value,.token.char,.token.regex,.token.string,.token.variable{
				color:#7ec699;
			}
			.token.entity,.token.operator,.token.url{
				color:#67cdcc;
			}
			.token.bold,.token.important{
				font-weight:700;
			}
			.token.italic{
				font-style:italic;
			}
			.token.entity{
				cursor:help;
			}
			.token.inserted{
				color:green;
			}
		}
		`;

		InstanceId;
		IsInitialized;

		EditorBuffer = [];
		MessageIdx = 0;
		AsiPolite = null;
		LastValue = null;

		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(DynamicTextareaEl.Name).prototype);
			}
			this.InstanceId = DynamicTextareaEl.InstanceCount++;
			if(this.InstanceId === 0) {
				DynamicTextareaEl.EditorMode = localStorage.getItem(`${DynamicTextareaEl.Name}-editor-mode`) === "on";
			}

			this.AsiPolite = document.createElement("aside");
			this.AsiPolite.setAttribute("aria-live", "polite");
			this.AsiPolite.setAttribute(
				"style",
				"position: absolute; left: -99999999px; top: 0px;"
			);
		}

		get Root() {
			return this.getRootNode();
		}
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
		get IsInShadowDom() {
			return this.Root.toString() === "[object ShadowRoot]";
		}

		getId(key) {
			return `${DynamicTextareaEl.Name}-${this.InstanceId}-${key}`;
		}
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		get TextArea() {
			return this.querySelector("textarea");
		}
		get Code() {
			return this.querySelector("code");
		}

		connectedCallback() {
			if(!this.Root.querySelector(`style.${DynamicTextareaEl.Name}`)) {
				this.Head.insertAdjacentHTML(
					"beforeend",
					`
					<style class=${DynamicTextareaEl.Name}>${DynamicTextareaEl.Style}</style>
					<style class=${DynamicTextareaEl.Name}>${DynamicTextareaEl.PrismStyle}</style>
					`
				);
			}
			this.insertAdjacentElement("afterend", this.AsiPolite);

			DynamicTextareaEl.InstanceMap[this.InstanceId] = this;
			if(!this.IsInitialized) {
				const observer = new MutationObserver((_mutationList, _observer) => {});
				observer.observe(this, {attributes: true, childList: false, subtree: false});

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
			else {
				this.updateState();
			}
		}

		disconnectedCallback() {
			delete DynamicTextareaEl.InstanceMap[this.InstanceId];
		}

		renderContent() {
			this.insertAdjacentHTML("afterbegin", `
				<aside id="${this.getId("asiInstruct")}" aria-hidden="true"></aside>
				<div id="${this.getId("divLang")}" class="lang" aria-hidden="true">${this.getAttribute("data-language") || ""}</div>
				<label id="${this.getId("lblToggle")}" class="mode-toggle" aria-hidden="true">
					<svg class="not-checked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M384 80c8.8 0 16 7.2 16 16V416c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V96c0-8.8 7.2-16 16-16H384zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z"/></svg>
					<svg class="checked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/></svg>
					<span>Editor Mode</span> <span>(<kbd>F2</kbd>)</span>
				</label>
				<code aria-hidden="true"></code>
			`);

			this.getRef("lblToggle").addEventListener("click", this.onToggleClick);

			this.TextArea.setAttribute(
				"aria-describedby",
				[
					this.TextArea.getAttribute("aria-describedby"),
					this.getId("divLang"),
					this.getId("asiInstruct")
				].filter(id => !!id).join(" ")
			);
			if(this.hasAttribute("data-language")) {
				this.TextArea.setAttribute("spellcheck", "false");
			}
			this.TextArea.addEventListener("keydown", this.onTxaKeydown);
			this.TextArea.addEventListener("input", this.doCodeHighlight);
			this.TextArea.addEventListener("scroll", this.updateCodePosition);
			this.#tapIntoValueSetter(this.TextArea, () => {
				this.doCodeHighlight();
				this.updateCodePosition();
			});

			this.updateState();
			this.doCodeHighlight();
			this.updateCodePosition();

			this.IsInitialized = true;
		}

		#tapIntoValueSetter(txa, customHandler) {
			const valueDescriptor = Object.getOwnPropertyDescriptor(
				Object.getPrototypeOf(txa),
				"value"
			);
			const originalSet = valueDescriptor.set;
		
			valueDescriptor.set = this.#createDelegate(
				txa,
				function(valueDescriptor, originalSet, customHandler, value) {
					const newSet = valueDescriptor.set;
					valueDescriptor.set = originalSet;
					Object.defineProperty(this, "value", valueDescriptor);
					
					this.value = value;
					
					valueDescriptor.set = newSet;
					Object.defineProperty(this, "value", valueDescriptor);
					
					customHandler();
				},
				[valueDescriptor, originalSet, customHandler]
			);
			
			Object.defineProperty(txa, "value", valueDescriptor);
		}
		#createDelegate(context, method, args) {
			return function generatedFunction() {
				return method.apply(context, (args || []).concat(...arguments));
			};
		}

		onToggleClick = (event) => {
			event.stopPropagation();
			DynamicTextareaEl.EditorMode = !DynamicTextareaEl.EditorMode;
			localStorage.setItem(`${DynamicTextareaEl.Name}-editor-mode`, DynamicTextareaEl.EditorMode ? "on" : "off");

			this.AsiPolite.insertAdjacentHTML("afterbegin", `
				<article id="${this.getId("msg-" + ++this.MessageIdx)}">
					Tab now ${DynamicTextareaEl.EditorMode  ? "adjusts indentation" : "moves focus"}
				</article>
			`);
			setTimeout((idx) => {
				this.AsiPolite.querySelector(`#${this.getId("msg-" + idx)}`).remove();
			}, 100, this.MessageIdx);

			Object.values(DynamicTextareaEl.InstanceMap).forEach(element => element.updateState());
		};

		updateState() {
			if(DynamicTextareaEl.EditorMode) {
				this.getRef("lblToggle").classList.add("checked");
				this.getRef("asiInstruct").innerText = "Editor mode is enabled, press F2 to toggle."
			}
			else {
				this.getRef("lblToggle").classList.remove("checked");
				this.getRef("asiInstruct").innerText = "Editor mode is disabled, press F2 to toggle."
			}
		}

		onTxaKeydown = (event) => {
			if(event.key === "z" && event.ctrlKey && this.EditorBuffer.length) {
				event.preventDefault();
				const bufferObj = this.EditorBuffer.pop();

				this.TextArea.value = bufferObj.Value;
				this.TextArea.selectionStart = bufferObj.SelStart;
				this.TextArea.selectionEnd = bufferObj.SelEnd;
			}
			else if(event.key === "F2") {
				this.onToggleClick(event);
			}
			else if(DynamicTextareaEl.EditorMode) {
				if(event.key === "Tab") {
					this.onTxaTab(event);
				}
				else if(event.key === "Enter") {
					this.onTxaEnter(event);
				}
				else if(event.key.length === 1 
					|| event.key === "Backspace"
					|| event.key === "Delete"
				) {
					this.EditorBuffer = [];
				}
			}
			this.doCodeHighlight();
		};

		onTxaTab = (event) => {
			const origValue = this.TextArea.value;
			const origStart = this.TextArea.selectionStart;
			const origEnd = this.TextArea.selectionEnd;
			const lineStart = origValue.lastIndexOf("\n", origStart - 1) + 1;
	
			if(origStart !== origEnd) {
				event.preventDefault();
	
				let containedStr = origValue.substring(lineStart, origEnd);
				let lines = containedStr.split("\n");
				const origLineZeroLen = lines[0].length;
				lines = lines.map(line => {
					if(event.shiftKey) {
						return (line[0] === "\t") ? line.substring(1) : line;
					}
					else {
						return "\t" + line;
					}
				});
				const shouldAdjustLineZero = lines[0].length !== origLineZeroLen && lines[0].length;
	
				containedStr = lines.join("\n");
				this.TextArea.value = origValue.substring(0, lineStart) + containedStr + origValue.substring(origEnd);
				this.TextArea.selectionStart = origStart;
				if(shouldAdjustLineZero) {
					this.TextArea.selectionStart += event.shiftKey ? -1 : 1;
				}
				this.TextArea.selectionEnd = origStart + containedStr.length - (origStart - lineStart);
			}
			else {
				if(event.shiftKey) {
					if(origValue.charAt(lineStart) === "\t") {
						event.preventDefault();
						this.TextArea.value = origValue.substring(0, lineStart) + origValue.substring(lineStart + 1);
						this.TextArea.selectionStart = origStart - 1;
						this.TextArea.selectionEnd = origEnd - 1;
					}
					else {
						return;
					}
				}
				else {
					event.preventDefault();
		
					this.TextArea.value = origValue.substring(0, origStart) + '\t' + origValue.substring(origEnd);
					this.TextArea.selectionStart = this.TextArea.selectionEnd = (origStart + 1);
				}
			}
			this.EditorBuffer.push({Value: origValue, SelStart: origStart, SelEnd: origEnd});
		};
	
		onTxaEnter = (event) => {
			const origValue = this.TextArea.value;
			const origStart = this.TextArea.selectionStart;
			const origEnd = this.TextArea.selectionEnd;
			const lineStart = origValue.lastIndexOf("\n", origStart - 1) + 1;
	
			let charIdx = lineStart;
			while(origValue[charIdx] === "\t") {
				charIdx++;
			}
	
			let insertStr = "\n" + "\t".repeat(charIdx - lineStart);
			this.TextArea.value = origValue.substring(0, origStart) + insertStr + origValue.substring(origEnd);
			this.TextArea.selectionStart = this.TextArea.selectionEnd = (origStart + insertStr.length);

			this.EditorBuffer.push({Value: origValue, SelStart: origStart, SelEnd: origEnd});
	
			event.preventDefault();
		};

		doCodeHighlight = () => {
			if(!Prism) { return; }

			const language = this.getAttribute("data-language");
			if(!language) { return; }

			const value = this.TextArea.value;
			if(this.LastValue === value) { return; }
			this.LastValue = value;

			this.Code.innerHTML = Prism.highlight(value, Prism.languages[language]);
		};

		updateCodePosition = () => {
			this.Code.style.setProperty("top", `-${this.TextArea.scrollTop}px`);
		};
	}
	if(!customElements.get(ns.DynamicTextareaEl.Name)) {
		customElements.define(ns.DynamicTextareaEl.Name, ns.DynamicTextareaEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.DynamicTextareaEl");