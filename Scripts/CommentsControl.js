/**
 * @file Comments control
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
(function Controls(ns) {
	const styleSheet = new CSSStyleSheet();
	styleSheet.replaceSync(`
		gw-comment-form, gw-comment-list {
			.input-horizontal-flex {
				display: flex;
				flex-direction: row;
				flex-wrap: wrap;
				justify-content: space-evenly;
				align-items: center;
				row-gap: 4px;
			}
			
			.input-vertical {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				margin-left: 5px;
				margin-right: 5px;
				
				> label {
					padding-bottom: 2px;
				}
			}
			
			.sr-only {
				position: absolute;
				left: -99999999px;
			}
		}

		gw-comment-form {
			.comment-form input {
				width: 135px;
			}
			
			.comment-box-container {
				margin-top: 5px;
				margin-left: auto;
				margin-right: auto;
				width: fit-content;
			}
			
			.comment-form-title {
				display: flex;
				justify-content: center;
				margin-bottom: 5px;
				font-size: 1.25em;
			}
			
			.inline-banner-wrapper {
				display: flex;
				
				> .inline-banner {
					width: 100%;
				}
			}
			
			.inline-banner {
				margin: 10px;
				border: 1px solid var(-border-color, black);
				background-color: var(--banner-color, lightgrey);
				color: var(--text-color, black);
				padding: 10px;
				word-break: break-word;
				display: flex;
				align-items: center;
				gap: 5px;
				
				&.warning {
					background-color: var(--banner-warn-color, #EDC200);
				}
			}

			form {
				border: 1px solid;
				padding: 5px;
				border-color: var(--border-color, black);
				width: fit-content;
				background-color: var(--background-color, white);
				
				> h1, > h2, > h3, > h4, > h5, > h6 {
					margin: 0;
					text-align: center;
				}
			}
			
			.form-footer {
				display: flex;
				flex-direction: row;
				justify-content: flex-end;
				
				> * {
					margin: 3px;
					min-height: 30px;
				}
			}
		}

		gw-comment-list {
		.comments-container {
				display: flex;
				flex-direction: column;
				align-items: stretch;
				max-width: 500px;
				gap: 5px;
			}
		}

		gw-comment-card {
			.comment-article {
				border-left: 2px solid var(--border-color, black);
				padding: 4px;
				background-color: var(--background-color, white);
				display: flex;
				flex-direction: column;
				
				blockquote {
					max-width: unset !important;
					overflow-wrap: break-word;
				}
				
				button {
					max-width: fit-content;
					height: 30px;
				}
				
				.comment-article {
					margin-inline-start: 10px;
					margin-block-start: 10px;
					padding-inline-end: 0px;
				}
			}
			
			.comment-header {
				display: grid;
				grid-template-columns: 0fr 1fr 1fr;
				gap: 5px;
				align-items: baseline;
			}
			
			.comment-id, .comment-header-right > time	{
				font-size: 0.85em;
				font-weight: lighter;
				font-style: italic;
				word-break: keep-all;
			}
			
			.comment-header-right {
				display: flex;
				flex-direction: row;
				justify-content: flex-end;
			}
			
			.commenter-name {
				font-size: 1.1em;
				font-weight: bold;
			}
			
			.comment-footer {
				display: flex;
				flex-direction: row;
				gap: 5px;
			}
			
			&:not(.collapsed) .show-comment {
				display: none;
			}
			
			&.collapsed {
				.comment-article > *:not(.comment-header) {
					display: none !important;
				}
				
				.show-comment {
					display: block;
				}
				
				.comment-header-right time {
					display: none;
				}
			}
		}
	`);
	document.adoptedStyleSheets.push(styleSheet);

	ns.CommentForm = class CommentForm extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		isInitialized;
		titleText;
		discordURL;
		encodedPath;
		fallbackEmail;
		omitStar;

		//#region element properties
		formEl;
		titleEl;
		bannerEl;

		dispNameInpt;
		emailInpt;
		websiteInpt;
		respToInpt;
		commentInpt;

		resetBtn;
		submitBtn;
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = CommentForm.instanceCount++;
			CommentForm.instanceMap[this.instanceId] = this;
		}

		get idKey() {
			return `gw-comment-form-${this.instanceId}`;
		}

		connectedCallback() {
			if (this.isInitialized) { return; }

			this.titleText = this.getAttribute("titleText") || "Add a Comment";
			this.discordURL = this.getAttribute("discordURL");
			this.encodedPath = this.getAttribute("encodedPath");
			this.fallbackEmail = this.getAttribute("fallbackEmail");
			this.omitStar = this.hasAttribute("omitStar");

			this.renderContent();
			this.registerHandlers();

			this.isInitialized = true;
		}

		renderContent() {
			//Markup
			this.innerHTML = `
			<form  id="${this.idKey}-form"
				aria-labelledby="${this.idKey}-title"
				aria-describedby="${this.idKey}-banner"
				class="comment-form"
				autocomplete="off"
			>
				<span id="${this.idKey}-title" class="comment-form-title">${this.titleText}</span>
				<div class="input-horizontal-flex">
					<div class="input-vertical">
						<label for="${this.idKey}-dispName">Display name${this.omitStar ? "" : "*"}</label>
						<input id="${this.idKey}-dispName" type="text" maxlength="1000" required="true">
					</div>
					<div class="input-vertical">
						<label for="${this.idKey}-email">Email</label>
						<input id="${this.idKey}-email" type="email">
					</div>
					<div class="input-vertical">
						<label for="${this.idKey}-website">Website</label>
						<input id="${this.idKey}-website" type="text" maxlength="1000">
					</div>
					<div class="input-vertical">
						<label for="${this.idKey}-respTo">Response to</label>
						<input id="${this.idKey}-respTo" type="number">
					</div>
				</div>
				<div class="comment-box-container">
					<div class="input-vertical">
						<label for="${this.idKey}-comment">Comment${this.omitStar ? "" : "*"}</label>
						<textarea  id="${this.idKey}-comment"
							minlength="1"
							maxlength="1000"
							required="true"
							rows="5"
							cols="33"
						></textarea>
					</div>
				</div>
				<div id="${this.idKey}-banner" class="inline-banner" aria-live="polite">
					<svg viewBox="0 0 512 512" role="img" style="width: 16px; height: 16px;">
						<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. -->
						<title>info</title>
						<path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"></path>
					</svg>
					<span>Comments are manually approved</span>
				</div>
				<div class="form-footer">
					<input id="${this.idKey}-submit" type="submit" value="Submit">
					<input id="${this.idKey}-reset" type="reset" value="Reset">
				</div>
			</form>
			`;

			//element properties
			this.formEl = document.getElementById(`${this.idKey}-form`);
			this.titleEl = document.getElementById(`${this.idKey}-title`);
			this.bannerEl = document.getElementById(`${this.idKey}-banner`);

			this.dispNameInpt = document.getElementById(`${this.idKey}-dispName`);
			this.emailInpt = document.getElementById(`${this.idKey}-email`);
			this.websiteInpt = document.getElementById(`${this.idKey}-website`);
			this.respToInpt = document.getElementById(`${this.idKey}-respTo`);
			this.commentInpt = document.getElementById(`${this.idKey}-comment`);

			this.resetBtn = document.getElementById(`${this.idKey}-reset`);
			this.submitBtn = document.getElementById(`${this.idKey}-submit`);

			//default values
			this.dispNameInpt.value = localStorage.getItem("comment-name") || "";
			this.emailInpt.value = localStorage.getItem("comment-email") || "";
			this.websiteInpt.value = localStorage.getItem("comment-website") || "";
		}

		//#region Handlers
		registerHandlers() {
			this.formEl.onsubmit = this.onSubmit;
		}

		onSubmit = (event) => {
			event.preventDefault();

			const contentObj = {
				name: this.dispNameInpt.value,
				email: this.emailInpt.value,
				website: this.websiteInpt.value,
				responseTo: this.respToInpt.value,
				comment: (
					this.commentInpt.value || ""
				).replaceAll("\n", "<br>").replaceAll("(", "\\("),
				timestamp: new Date().toUTCString(),
			};
			const contentAry = [];
			for (let contentKey in contentObj) {
				contentAry.push(`${contentKey}=${contentObj[contentKey]}`);
			}

			const request = new XMLHttpRequest();
				request.open(
				"POST",
				this.discordURL || atob("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv" + this.encodedPath),
				true
			);
			request.setRequestHeader("Content-Type", "application/json");

			request.onreadystatechange = () => {
				if (request.readyState !== XMLHttpRequest.DONE) { return; }
				if (Math.floor(request.status / 100) !== 2) {
					console.log(request.responseText);
					this.bannerEl.classList.add("warning");
					this.bannerEl.innerHTML =
					`
					<gw-icon iconKey="triangle-exclamation" title="warning"></gw-icon>
					<span>
						That didn't work.
						${this.fallbackEmail
							? `<a class="full" href="mailto:${this.fallbackEmail}?subject=Comment on ${document.title}&body=${contentAry.join("; ")}">Click here to send as an email instead</a>.`
							: ""
						}
					</span>
					`;
				}
				else {
					alert("Comment submitted!");
				}
			};

			request.send(JSON.stringify({
				embeds: [{
					fields: Object.keys(contentObj).map(key => { return { name: key, value: contentObj[key] }})
				}]
			}));

			localStorage.setItem("comment-name", contentObj.name);
			localStorage.setItem("comment-email", contentObj.email);
			localStorage.setItem("comment-website", contentObj.website);

			this.formEl.reset();
			this.dispNameInpt.value = contentObj.name;
			this.emailInpt.value = contentObj.email;
			this.websiteInpt.value = contentObj.website;
		};
		//#endregion
	};
	customElements.define("gw-comment-form", ns.CommentForm);
	GW?.Controls?.Veil?.clearDefer("GW.Controls.CommentForm");

	ns.CommentList = class CommentList extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		static Data = [];
		//#endregion

		//#region instance properties
		instanceId;
		isInitialized;
		gSpreadsheetId;
		gSheetId;
		isNewestFirst;
		gwCommentFormId;

		//#region element properties
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = CommentList.instanceCount++;
			CommentList.instanceMap[this.instanceId] = this;
			CommentList.Data[this.instanceId] = {};
		}

		get idKey() {
			return `gw-comment-list-${this.instanceId}`;
		}

		connectedCallback() {
			if (this.isInitialized) { return; }

			this.gSpreadsheetId = this.getAttribute("gSpreadsheetId");
			this.gSheetId = this.getAttribute("gSheetId");
			this.isNewestFirst = this.getAttribute("isNewestFirst");
			this.gwCommentFormId = this.getAttribute("gwCommentFormId");

			this.loadAndRender();

			this.isInitialized = true;
		}

		async loadAndRender() {
			this.innerHTML = `
			<div class="inline-banner">
				<gw-icon iconkey="circle-info" title="info"></gw-icon>
				<span>Comments loading....</span>
			</div>
			`

			const sheetReader = new GoogleSheetsReader(this.gSpreadsheetId, this.gSheetId);
			await sheetReader.loadData();
			this.innerHTML = "";

			const allComments = sheetReader.rowData;
			if (this.isNewestFirst) {
				allComments.reverse();
			}

			this.renderContent();
			this.registerHandlers();

			const allCommentsIndex = {};
			const topLevelCommentIdxs = [];
			const childCommentIdxs = [];
			for (let i = 0; i < allComments.length; i++) {
				const comment = allComments[i];
				allCommentsIndex[comment.ID] = i;
				if (!comment.ResponseTo) {
					topLevelCommentIdxs.push(i);
				}
				else {
					childCommentIdxs.push(i);
				}
			}
			childCommentIdxs.forEach(childIdx => {
				const replyId = allComments[childIdx].ResponseTo;
				const respondeeComment = allComments[allCommentsIndex[replyId]];

				respondeeComment.ChildIdxs = respondeeComment.ChildIdxs || [];
				respondeeComment.ChildIdxs.push(childIdx);
			});

			let commentsToBuild = [];
			topLevelCommentIdxs.forEach(
				topCommentIdx => commentsToBuild.push({
					parent: this.containerEl,
					comment: allComments[topCommentIdx]
				})
			);

			while (commentsToBuild.length > 0) {
				let { parent, comment } = commentsToBuild.shift();
				if (!comment.Timestamp) {
					continue;
				}

				CommentList.Data[this.instanceId][comment.ID] = comment;

				parent.insertAdjacentHTML("beforeend", `
				<gw-comment-card  id="${this.idKey}-cmt-${comment.ID}"
					listInstance=${this.instanceId}
					commentId=${comment.ID}
					gwCommentFormId=${this.gwCommentFormId || ""}
				></gw-comment-card>
				`);

				const commentEl = document.getElementById(`${this.idKey}-cmt-${comment.ID}`);
				(comment.ChildIdxs || []).forEach(
					childIdx => commentsToBuild.push({
						parent: commentEl.articleEl,
						comment: allComments[childIdx]
					})
				);
			}
		}

		renderContent() {
			//Markup
			this.innerHTML = `
			<div id="${this.idKey}-container" class="comments-container"">
			</div>
			`;

			//element properties
			this.containerEl = document.getElementById(`${this.idKey}-container`);
		}

		//#region Handlers
		registerHandlers() {
		}
		//#endregion
	};
	customElements.define("gw-comment-list", ns.CommentList);
	GW?.Controls?.Veil?.clearDefer("GW.Controls.CommentList");

	ns.CommentCard = class CommentCard extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		isInitialized;

		commentId;
		gwCommentFormId;

		replyToId;
		numChildren;
		commenterName;
		datetime;
		websiteURL;
		commentText;

		//#region element properties
		articleEl;
		replyBtn;
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = CommentCard.instanceCount++;
			CommentCard.instanceMap[this.instanceId] = this;
		}

		get idKey() {
			return `gw-comment-card-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback() {
			if (this.isInitialized) { return; }
			
			this.commentId = this.getAttribute("commentId");
			this.gwCommentFormId = this.getAttribute("gwCommentFormId");

			const commentData = ns.CommentList.Data[this.getAttribute("listInstance")][this.commentId];

			this.replyToId = commentData.ResponseTo;
			this.numChildren = (commentData.ChildIdxs || []).length;
			this.commenterName = commentData["Display Name"];
			this.datetime = commentData.Timestamp;
			this.websiteURL = commentData.Website;
			this.commentText = this.parseCommentText(commentData.Comment);

			this.renderContent();
			this.registerHandlers();

			this.isInitialized = true;
		}
		//#endregion

		renderContent() {
			let headerText = this.replyToId
				? `Comment #${this.commentId} replying to #${this.replyToId}`
				: `Top level comment #${this.commentId}`;
			headerText += ` with ${this.numChildren} direct ${this.numChildren == 1 ? "reply" : "replies"}`;

			const displayTimestamp = this.datetime.toLocaleString(
				undefined,
				{ dateStyle: "short", timeStyle: "short" }
			);

			const commenterNameEl = this.websiteURL
				? `<a href="${this.websiteURL}" target="_blank" class="commenter-name">${this.commenterName}</a>`
				: `<span class="commenter-name">${this.commenterName}</span>`;

			//Markup
			this.innerHTML = `
			<article  id="${this.idKey}-article"
				aria-labelledby="${this.idKey}-header"
				class="comment-article"
			>
				<div id="${this.idKey}-header" class="comment-header">
					<div class="comment-id" role="img" aria-label="${headerText}">
						<span aria-hidden="true" class="comment-id">#${this.commentId}</span>
					</div>
					${commenterNameEl}
					<div class="comment-header-right">
						<time id="${this.idKey}-timestamp"
							datetime="${this.datetime.toISOString()}"
							tabindex="-1"
						>${displayTimestamp}</time>
						<button id="${this.idKey}-show" class="show-comment">Show #${this.commentId}</button>
					</div>
				</div>
				<blockquote>${this.commentText}</blockquote>
				<div class="comment-footer">
					<button id="${this.idKey}-reply">Reply to #${this.commentId}</button>
					<button id="${this.idKey}-hide">Hide #${this.commentId}</button>
				</div>
			</article>
			`;

			//element properties
			this.articleEl = document.getElementById(`${this.idKey}-article`);
			this.timestamp = document.getElementById(`${this.idKey}-timestamp`);
			this.replyBtn = document.getElementById(`${this.idKey}-reply`);
			this.hideBtn = document.getElementById(`${this.idKey}-hide`);
			this.showBtn = document.getElementById(`${this.idKey}-show`);
		}

		//#region Handlers
		registerHandlers() {
			this.replyBtn.onclick = this.onReply;
			this.hideBtn.onclick = this.onHide;
			this.showBtn.onclick = this.onShow;
		}

		onReply = () => {
			const gwCommentForm = document.getElementById(this.gwCommentFormId);
			const respToInpt = gwCommentForm.respToInpt;
			if (!respToInpt) {
				alert("Comment form not found");
				return;
			}

			respToInpt.value = this.commentId;
			respToInpt.focus();
		};

		onHide = () => {
			this.classList.add("collapsed");
			this.showBtn.focus();
		};

		onShow = () => {
			this.classList.remove("collapsed");
			this.timestamp.focus();
		};
		//#endregion

		parseCommentText(commentString) {
			let commentText = "";
			let linkObj = {};

			for(let i = 0; i < commentString.length; i++){
				let char = commentString.charAt(i);
				switch (char) {
					case '[':
						linkObj = {tStart: i};
						break;
					case ']':
						if(linkObj.tStart !== undefined && linkObj.tStart !== i-1) {
							linkObj.tEnd = i;
						}
						else { linkObj = {}; }
						break;
					case '(':
						if(linkObj.tEnd !== undefined && linkObj.tEnd === i-1) {
							linkObj.lStart = i;
						}
						else { linkObj = {}; }
						break;
					case ')':
						if(linkObj.lStart !== undefined && linkObj.lStart !== i-1) {
							linkObj.lEnd = i;
						}
						else { linkObj = {}; }
						break;
				}
				if(linkObj.lEnd !== undefined) {
					const linkText = commentString.substring(linkObj.tStart + 1, linkObj.tEnd);
					const linkURL = commentString.substring(linkObj.lStart + 1, linkObj.lEnd);
					commentText = commentText.substring(0, commentText.length - (i - linkObj.tStart));
					commentText += `<a href="${linkURL}" target="_blank">${linkText}</a>`;
					linkObj = {};
				}
				else {
					commentText += char;
				}
			}
			return commentText;
		}
	};
	customElements.define("gw-comment-card", ns.CommentCard);
	GW?.Controls?.Veil?.clearDefer("GW.Controls.CommentCard");

	class GoogleSheetsReader {
		//setResponse is intended for React - it's how google responds to our GET. Fortunately valid JSON is inside this call, so we can just parse it out.
		static #RESPONSE_PREFIX = "setResponse(";
		static #RESPONSE_SUFFIX = ");";

		//Here we can define any custom types based on column label. "Timestamp" is intended for ISO 8601 format date/time strings.
		static #CUSTOM_LABEL_TYPES = {
			"Timestamp": "timestamp"
		};

		spreadsheetId; //The ID of the spreadsheet. This is the part just after /d/ in the docs.google.com URL
		sheetName; //The name of the particular sheet we're after

		#sheetURL; //Composed request URL

		loadPromise = null; //A promise created when loading begins and which resolves when data has finished loading.
		tableJSON = null; //Raw JS Object version of the returned JSON.
		rowData = null; //Parsed row data
		colData = null; //A shortcut to the the column data in tableJSON
		colIndex = null; //An index from column label to its metadata, plus array position

		/**
		 * Constructs a GoogleSheetsReader object
		 * spreadsheetId is the part of the docs.google.com URL just after /d/
		 * sheetName is the name of the particular page
		 */
		constructor(spreadsheetId, sheetName) {
			this.spreadsheetId = spreadsheetId;
			this.sheetName = sheetName;
			this.#sheetURL = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${sheetName}`;
		}

		/**
		 * Loads and parses sheet data via HTTP GET
		 * Returns null on success, and an error string on failure.
		 */
		async loadData() {
			this.loadPromise = this.#loadData();
			return this.loadPromise;
		}

		async #loadData() {
			this.tableJSON = null;
			this.rowData = null;
			this.colData = null;
			this.colIndex = null;

			const response = await fetch(this.#sheetURL);
			if (response.ok) {
				return response.text().then((unparsedData) => {
					//This is parsing out the valid JSON from the React method they gave us
					const targetData = unparsedData.split(
						GoogleSheetsReader.#RESPONSE_PREFIX
					)[1].split(
						GoogleSheetsReader.#RESPONSE_SUFFIX
					)[0];

					this.tableJSON = GoogleSheetsReader.#applyCustomLabelTypes(JSON.parse(targetData).table);
					this.rowData = GoogleSheetsReader.#parseAllRows(this.tableJSON);
					this.colIndex = GoogleSheetsReader.#indexColumns(this.tableJSON);
					this.colData = this.tableJSON.cols;

					return null;
				});
			}
			else {
				return response.statusText || response.status;
			}
		}

		/**
		 * Overrides any google-returned column data types with custom ones based on label
		 */
		static #applyCustomLabelTypes(tableJSON) {
			tableJSON.cols.forEach(col => {
				if(this.#CUSTOM_LABEL_TYPES[col.label]) {
					col.type = this.#CUSTOM_LABEL_TYPES[col.label]
				};
			});
			return tableJSON;
		}

		static #parseAllRows(tableJSON) {
			const rowDataArray = [];
			for(let i = 0; i < tableJSON.rows.length; i++) {
				rowDataArray.push(this.#parseRow(i, tableJSON));
			}
			return rowDataArray;
		}

		static #parseRow(rowIdx, tableJSON) {
			const rowData = {};
			const cells = tableJSON.rows[rowIdx].c;

			for(let i = 0; i < cells.length; i++) {
				rowData[tableJSON.cols[i].label] = this.#parseCellType(cells[i], tableJSON.cols[i].type);
			}
			return rowData;
		}

		/**
		 * Parses a cell based on its type. Further custom types will need their own parsing added here.
		 */
		static #parseCellType(cellData, cellType) {
			switch (cellType) {
				case "string":
					return cellData ? cellData.v : cellData;
				case "number":
					return cellData ? cellData.v : cellData;
				case "datetime":
				case "date":
					return (cellData && cellData.v) ? eval("new " + cellData.v) : null;
				case "timestamp":
					const cellTimestamp = new Date(cellData ? cellData.v : "");
					return isNaN(cellTimestamp) ? null : cellTimestamp;
				default:
					return cellData;
			}
		}

		static #indexColumns(tableJSON) {
			const colIndex = {};
			for(let i = 0; i < tableJSON.cols.length; i++) {
				const colData = tableJSON.cols[i];
				colIndex[colData.label] = {...colData, index: i};
			}
			return colIndex;
		}
	};
}) (window.GW.Controls = window.GW.Controls || {});