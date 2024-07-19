/**
 * @file This is a script for an image gallery control
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
window.GW.Controls = window.GW.Controls || {};
(function Gallery(ns) {
	/**
	* FOR YOU TO UPDATE
	* 
	* Modify this object to describe the images you want to display on your page!
	* If you want multiple image galleries, you can create other objects below this to describe them.
	* "Example1" should be changed to the "name" you give to your <gw-gallery> element :)
	*/
	ns.Example1 = {
		imageList: [ //The filenames of your images in the order you want them to appear. The default is for the gallery to start at the latest (last) image.
			"Slide1",
			"Slide2",
		],
		imageFolder: "https://groundedwren.neocities.org/img", //Where all the image files on your site live
		imageInfo: {
			"Slide1": {
				title: "Title One", //This is the display name for your image
				date: new Date("October 10, 2023"), //This is the date which will display by your image title
				alt: "Alternative text 1", //This is text displayed to those using screen readers or visually when the image doesn't load
				extension: "png" //The file type of your image
			},
			"Slide2": {
				title: "Title Two",
				date: new Date("October 11, 2023"),
				alt: "Alternative text 2",
				extension: "png"
			},
		}
	};

	ns.GalleryEl = class GalleryEl extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		curImg;

		shadow;
		btnPrev;
		btnNext;
		figureContainer;
		minImgWidth;
		reflowWidth;
		//#endregion

		constructor() {
			super();
			this.instanceId = GalleryEl.instanceCount++;
			GalleryEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback() {
			this.name = this.getAttribute("name");
			this.minImgWidth = this.getAttribute("minImgWidth");
			this.reflowWidth = this.getAttribute("reflowWidth");

			this.renderContent();
			this.registerHandlers();
		}
		//#endregion

		renderContent() {
			//Markup
			this.shadow = this.attachShadow({ mode: "open" });
			this.shadow.innerHTML = `
			<style>
				#galleryContainer {
					container-type: inline-size;
				}

				#gallery {
					display: grid;
					grid-template-columns: auto 1fr auto;
					gap: 10px;
					justify-items: center;
					align-items: center;
				}

				@container(max-width: ${this.reflowWidth || "0px"}) {
					#gallery {
						grid-template-columns: 1fr 1fr;
						grid-template-rows: 1fr auto;
					}
					#figureContainer {
						grid-row: 1;
						grid-column: 1 / -1;
					}
				}

				#figureContainer {
					max-width: calc(100% - 70px); /* 70px is the width of both nav buttons */
					overflow-x: auto;
				}

				.nav-button {
					width: 35px;
				}
			</style>

			<section id="galleryContainer" aria-label="${this.name} image gallery">
				<div id="gallery">
					<button id="prevImg" class="nav-button" aria-labelledby="prevTitle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
							<title id="prevTitle">Previous</title>
							<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. -->
							<path d="M9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-128-128z"></path>
						</svg>
					</button>
					<div id="figureContainer"></div>
					<button id="nextImg" class="nav-button" aria-labelledby="nextTitle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
							<title id="nextTitle">Next</title>
							<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. -->
							<path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z"></path>
						</svg>
					</button>
				</div>
			</section>
			`;

			//element properties
			this.btnPrev = this.shadow.getElementById(`prevImg`);
			this.btnNext = this.shadow.getElementById(`nextImg`);
			this.figureContainer = this.shadow.getElementById(`figureContainer`);
		}

		//#region Handlers
		registerHandlers() {
			this.btnPrev.onclick = () => {
				const imageList = ns[this.name].imageList;
				let curIdx = imageList.indexOf(this.curImg);
				if(curIdx < 0) { curIdx = 0; }

				const newIdx = curIdx === 0
					? imageList.length - 1
					: curIdx - 1;
				this.loadImage(imageList[newIdx]);
			};

			this.btnNext.onclick = () => {
				const imageList = ns[this.name].imageList;
				let curIdx = imageList.indexOf(this.curImg);
				if(curIdx < 0) { curIdx = 0; }

				const newIdx = curIdx === (imageList.length - 1)
					? 0
					: curIdx + 1;
				this.loadImage(imageList[newIdx]);
			};

			window.addEventListener("load", () => {  
				const urlParams = new URLSearchParams(window.location.search);
				const imageList = ns[this.name].imageList;

				const imageName = urlParams.has(this.name)
					? urlParams.get(this.name)
					: imageList[imageList.length - 1];

				this.loadImage(imageName);
			});
		}

		loadImage(imageName) {
			this.curImg = imageName;
			const galFig = document.createElement("gw-gallery-figure");
			galFig.name = this.name;
			galFig.image = this.curImg;
			galFig.minImgWidth = this.minImgWidth;
			galFig.onImgLoaded = () => {
				this.figureContainer.replaceChildren(galFig);
				this.figureContainer.ariaLive = "polite"; //we don't want to announce changes until after initial load
				this.updateLocation(imageName);
			};
			galFig.renderContent();
		}

		updateLocation(imageName) {
			let params = window.location.search.replaceAll("?","").split("&").reduce((acc, cur) => {
				if(!cur) {return acc;}

				let pieces = cur.split("=");
				acc[pieces[0]] = pieces[1];
				return acc;
			}, {});

			params[this.name] = imageName;

			const paramsStr = Object.keys(params).reduce((acc, cur) => {
				if(!acc.length)
				{
					acc = "?";
				}
				else
				{
					acc = acc + "&";
				}
				return acc + cur + "=" + params[cur];
			}, "");
			window.history.replaceState(null, "", paramsStr);
		}
		//#endregion
	};
	customElements.define("gw-gallery", ns.GalleryEl);

	ns.FigureEl = class FigureEl extends HTMLElement {
		//#region staticProperties
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		name;
		image;
		onImgLoaded;
		minImgWidth;

		//#region element properties
		shadow;
		//#endregion
		//#endregion

		constructor() {
			super();
			this.instanceId = FigureEl.instanceCount++;
			FigureEl.instanceMap[this.instanceId] = this;
		}

		renderContent() {
			const imageList = ns[this.name].imageList;
			const imageInfo = ns[this.name].imageInfo[this.image];
			//Markup
			this.shadow = this.attachShadow({ mode: "open" });
			this.shadow.innerHTML = `
			<style>
				figure {
					margin: 0;
				}

				#galleryImg {
					max-width: calc(100% - 6px); /* 6px for the border */
					min-width: ${this.minImgWidth || "auto"};

					max-height: auto; /* Change these to some value if you want the images to be of consistent height */
					min-height: auto;

					border: 3px solid var(--border-color, black); /* You may replace var(--border-color) with whatever color your want */
				}

				#imagePageNum {
					float: right;
					margin-left: 2px;
				}
			</style>

			<figure>
				<img id="galleryImg" alt="${imageInfo.alt}">
				<figcaption>
					<span>${imageInfo.title}</span>
					<time datetime="${imageInfo.date.toISOString()}">(${imageInfo.date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })})</time>
					<span id="imagePageNum">#${imageList.indexOf(this.image)+1} of ${imageList.length}</span>
				</figcaption>
			</figure>
			`;

			//element properties
			this.galleryImg = this.shadow.getElementById(`galleryImg`);
			this.galleryImg.onload = this.onImgLoaded;
			this.galleryImg.src=`${ns[this.name].imageFolder}/${this.image}.${imageInfo.extension}`;
		}
	};
	customElements.define("gw-gallery-figure", ns.FigureEl);
}) (window.GW.Controls.Gallery = window.GW.Controls.Gallery || {});