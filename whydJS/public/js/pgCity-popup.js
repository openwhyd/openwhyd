/**
 * Script qui affiche une popup contenant du HTML
 * @author: guillaumegaubert, whyd
 **/
 

var GGPopup = {

	// Default id for CSS
	id: 'ggpopup',

	// Default CSS class name for blurred elements
	blurredClass : 'ggpopup-blurred',

	// If we blur background content
	blur: true,

	blurElements : [],


	// Init
	init: function(){
		var self = this;

		// Listen for ESC key
		document.addEventListener("keyup", function(e){
			// If press ESC
			if(e.keyCode == 27) {
				// Check if the popup if already opened
				if(self.me()) {
					// Close popup
					self.close();
				}
			}
		});
	},

	// Create the popup HTML layout
	createDOM: function(id) {

		var self = this;

		this.id = id;

		var wrapper = document.createElement("div");
		wrapper.id = id;
		wrapper.style.display = "table";

		var global = document.createElement("div");
		global.id = "global";
		global.onclick = function(e){
			if(e.toElement == this) {
				self.close();
			}
		};

		var content = document.createElement("div");
		content.id = "container";

		var close = document.createElement("a");
		close.href = "javascript:GGPopup.close();";
		close.className = "close";
		close.innerHTML = "Close";

		global.appendChild(content);
		global.appendChild(close);
		wrapper.appendChild(global);

		document.body.appendChild(wrapper);

		return content;
	},

	// Display the popup with the HTML in parameter
	show: function(id, html) {

		// Init
		this.init();

		// Check if we want to blur background
		if(this.blur) {
			this.blurBackground();
		}

		// Insert content
		var content = this.createDOM(id);
		content.innerHTML += html;

		// Block page scrolling
		document.body.style.overflow = "hidden";
	},

	// Update the html content of the popup
	update: function(html) {
		var content = this.me().children[0].children[0];
		content.innerHTML = html;
	},

	// Close the popup
	close: function(){
		// Unblur background
		if(this.blur) {
			this.unblurBackground();
		}

		// Remove elements
		this.blurElements = [];

		// Reset page scrolling
		document.body.style.overflow = "auto";

		// Remove popup
		document.body.removeChild(this.me());
	},

	// Returns the popup element
	me: function(){
		return document.getElementById(this.id);
	},

	// Set the elements to be blurred
	setBlurred: function(els){
		for(var i = 0; i < els.length; i++) {
			this.blurElements.push(els[i]);
		}
	},

	// Blur the background elements
	blurBackground: function(){
		for(var i = 0; i < this.blurElements.length; i++) {
			var el = this.blurElements[i];
			var classe = this.blurredClass;
			if(el.className.length > 0) {
				classe = el.className+" "+this.blurredClass;
			}
			el.className += classe;
		}
	},

	unblurBackground: function(){
		for(var i = 0; i < this.blurElements.length; i++) {
			var el = this.blurElements[i];

			// Remove blurred class
			var classe = el.className;
			classe = classe.replace(this.blurredClass, '');

			el.className = classe;
		}
	}
	
};
