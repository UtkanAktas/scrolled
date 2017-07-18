/*!
MIT License

Copyright (c) 2017 Utkan AKTAŞ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
//CONTENT SCROLL PLUGIN
//scroll belirli bir pozisyon aralığına girdiğinde bir callBack fonksiyonu çalıştıran plugin
//başlangıç aşamasında callback functionlara bağlanacak tüm elemnetler plugin e yüklenir.
//addScroll()

//onWindowLoad olduğundan tüm elementlerinin posizyonları alınır.
//bu aşamadan sonra scroll eventi dinlenir. socroll belirlenen aralığa girdiğinde o element için callback fonksiyon
//calıştırılır.

//windows resize olduğunda tüm elementlerin posizyonları yeniden hesaplanır.
;(function($, window, document, undefined){
	//bu plugin stand alone javascript librariy olacak şimdilik sadece jQuery methodları eklenmiş durumdadır.
	"use strict";
	var _scrolled,
		_defaults = {//it carry plugin default options
			autoStart:true,//true olarak set edildiğinde windows on load durumna girdiğinde program başlar
			//false olarak set edildiğinde programı başlatmak için .start() methodunun manuel olarak çağrılması gerekir.
			//örneğin proLoader.finish( scrolled.start() )
		},
		_nodeOpt = {// it carry default options for every node
			top:100,//sayfanın scrollTOp değeri bu değerler arasında ise veya
			//sayfanın scrollTOp + wiev port değeri bu değerler arasında ise callBack tetiklenir.
			bottom:-100,
			timeOut:0,//when event triggered it will add extra time out to execute callBack function
			run:1,//how many time that node will be callculated and executed
		};
		

	function PLUGIN(options){
		
		options = options || {};
		
		//alt satırda yazanlar starndartlaşmış public özelliklerdir.
		this.settings = $.extend({},_defaults,options);
		this._defaults = _defaults;
		this.status = {
			run:false,//when program iniiate this will be true
		};
		this.list =[//it will hold an object for all listening nodes
			/*
			{
				node: html element
				settings: settings object for this node
				range: [start, finish] scroll triger position range for this node
				callBack: callback function when scrolled is trigger this function will be executed
			}
			*/
		];
		
		
		
		this.init();
		
		
		
	}
	
	$.extend(PLUGIN.prototype,{
		init:function(){
			var self = this;
			
			//check auto start is enable
			if(this.settings.autoStart){
				$(window).on("load",function(){					
					self.start();
				});
			}
			
			//add event lister for windows resize to recalculate element positions
			$(window).on("resize",function(){
				self.calculateList();
			});
			
			//add event listener on scroll change
			$(window).on("scroll",function(){
				//check status is active
				if(!self.status.run){
					return;
				}
				self.checkVisible( self.getCurScrl() );
				
			});
			
		},
		start:function(){
			//this function will initiate the program
			if(this.status.run){
				return this;
			}
			this.status.run = true;
			this.calculateList();
			this.checkVisible( this.getCurScrl() );
			return this;
		},
		addScroll:function( selector, options, callBack){
			//verilen her bir node için list içerisinde bir object oluşturur ve settings le birlikte
			//node'u list içerisine kayıt eder.
			var settings,
				$el,
				obj,
				self = this;
			
			if(!selector || !options){
				return this;
			}
			
			//correct options and callback
			if(typeof callBack === "undefined"){
				if(typeof options !== "function"){
					//if callBack is und defined and options is not a function
					//that means there is no callBack function
					//add this is pointless
					return this;
				}else{
					//if options is a function that means there is no given options
					callBack = options;
					options = {};
				}
			}
			
			//get settings
			settings = $.extend({},_nodeOpt,options);
			
			//check selector is jquery object
			if(selector instanceof jQuery){
				$el = selector;
			}else{
				$el = $( selector );
			}

			
			$el.each(function( index, element ){
				obj = {};
				obj.node = element;
				obj.settings = settings;
				obj.range = [];
				obj.runTime = 0;//how mandy time this object executed before
				obj.done = false;//when it is reach run limit this will be true
				obj.callBack = callBack;
				
				self.list.push( obj );
				
			});
			
			obj = null;
			$el = null;
			self = null;
			selector = null;
			
			return this;
			
		},
		calculateList:function(){
			//bu fonksiyon list içerisinde biriktirilmiş tüm objeler için bir işlem yürütür.
			//her bir objenin document içerisindeki konumunu belirler
			//belirlenen konuma settings içindeki top ve bottom margin değerleri eklenerek
			//o elementin gösterime gireceği aralık belirlenir.
			var len = this.list.length,//this.list.length
				i =0,
				pos,//it will hold position values
				curObj;//it will hold list[ i ]
			
			for( ; i<len ; i++){
				curObj = this.list[ i ];
				if(curObj.done){
					//if this job is done go for next iteration
					continue;
				}
				pos = this.getPosition( curObj.node );
				
				//calculte top
				this.list[ i ].range[0] = curObj.settings.top + pos.top;
				this.list[ i ].range[1] = curObj.settings.bottom + pos.top + pos.height;
				if(this.list[ i ].range[1] <= this.list[ i ].range[0] ){
					this.list[ i ].range[1] = this.list[ i ].range[0] + 1;
				}
			}
			
		},
		getPosition:function( node ){
			//it will return object that contain postion data of given node
			var box = node.getBoundingClientRect();

			var body = document.body;
			var docEl = document.documentElement;
		
			var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
			var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
		
			var clientTop = docEl.clientTop || body.clientTop || 0;
			var clientLeft = docEl.clientLeft || body.clientLeft || 0;
		
			var top  = box.top +  scrollTop - clientTop;
			var left = box.left + scrollLeft - clientLeft;
		
			return { top: Math.round(top), left: Math.round(left), width:box.width, height:box.height };
		},
		checkVisible:function( scrTop ){
			//fonksiyon list içerisindeki elementlerin ekranda görünür olup olmadığını denetler
			//görünür durumda olan elementler için callBack fonksiyonu çağırır
			//scrTop === scroll top position
			
			var len = this.list.length,
				i = 0,
				w,//wiewport height
				wt,//viewport top value
				wb,//viewport bottom value
				curObj;
			
			//get viewport 
			w = this.getViewPort();
			
			wt = scrTop;
			wb = scrTop + w;
			
			
			for( ; i<len ; i++){
				curObj = this.list[ i ];
				if(curObj.done){
					//if this job allready done jump to next iteration
					continue;
				}

				//check it is wisible
				if( ( curObj.range[0] >= wt && curObj.range[0] <= wb ) ||
					( curObj.range[1] >= wt && curObj.range[1] <= wb  ) ){
					
						//if its wisible fire call back function
						this.executeCallBack( curObj );
						
						//increase run time for this job
						this.list[ i ].runTime += 1;
						
						//check runtime is reach max run
						if(this.list[ i ].runTime >= curObj.settings.run){
							//remove object from list
							this.list.splice(i,1);
							//correct i value for further loop iteration
							len -= 1;
							i-=1;

							
						}
				}
				
								}
			
		},
		executeCallBack:function( obj ){
			setTimeout(function(){
				obj.callBack( obj.node );
			},obj.settings.timeOut);
		},
		getViewPort:function(){
			if ('innerHeight' in window) {
				return window.innerHeight;
			} else {
				return document.documentElement.clientHeight;
			}
		},
		getCurScrl:function(){
			if(window.pageYOffset!=="undefined"){
				return window.pageYOffset;
			}
			
			//for older browser ie8 and below
			return document.documentElement.scrollTop;
		},
		
	});
		
		
		
	_scrolled = function(options){
		return new PLUGIN(options);
	};
	
	window.scrolled = _scrolled;
	
	
})(jQuery, window, document);
