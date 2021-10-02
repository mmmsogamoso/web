"use strict";

// Global variables
var
	userAgent = navigator.userAgent.toLowerCase(),
	initialDate = new Date(),

	$document = $(document),
	$window = $(window),
	$html = $("html"),

	isDesktop = $html.hasClass("desktop"),
	isIE = userAgent.indexOf("msie") != -1 ? parseInt(userAgent.split("msie")[1]) : userAgent.indexOf("trident") != -1 ? 11 : userAgent.indexOf("edge") != -1 ? 12 : false,
	isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
	isNoviBuilder,

	plugins = {
		materialParallax: $( ".parallax-container" ),
		rdNavbar:         $( ".rd-navbar" ),
		textRotator:      $( ".text-rotator" ),
		owl:              $( ".owl-carousel" ),
		swiper:           $( ".swiper-slider" ),
		counter:          $( ".counter" ),
		progressBar:      $( ".progress-linear" ),
		pageLoader:       $( ".page-loader" ),
		captcha:          $( '.recaptcha' ),
		copyrightYear:    $( ".copyright-year" ),
		videBG:           $( '.bg-vide' ),
		rdInputLabel:     $( ".form-label" ),
		regula:           $( "[data-constraints]" ),
		rdMailForm:       $( ".rd-mailform" ),
		maps:             $( ".google-map-container" ),
		lazyIFrame:       $( 'iframe[data-src]' )
	};

/**
 * isScrolledIntoView
 * @description  check the element whas been scrolled into the view
 */
function isScrolledIntoView(elem) {
	return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
}

/**
 * @desc Calls a function when element has been scrolled into the view
 * @param {object} element - jQuery object
 * @param {function} func - init function
 */
function lazyInit( element, func ) {
	var scrollHandler = function () {
		if ( ( !element.hasClass( 'lazy-loaded' ) && ( isScrolledIntoView( element ) ) ) ) {
			func.call();
			element.addClass( 'lazy-loaded' );
		}
	};

	scrollHandler();
	$window.on( 'scroll', scrollHandler );
}

$window.on( 'load', function() {
	/**
	 * Page loader
	 * @description Enables Page loader
	 */
	if ( plugins.pageLoader.length ) {
		var pageLoaded = function() {
			plugins.pageLoader.addClass( 'loaded' );
			$window.trigger( 'resize' );
		};

		if ( !isNoviBuilder ) setTimeout( pageLoaded, 200 );
		else pageLoaded();
	}

	// Progress bar
	if ( plugins.progressBar.length ) {
		for ( var i = 0; i < plugins.progressBar.length; i++) {
			var
				bar = $(plugins.progressBar[i]),
				initProgress = function() {
					var
						bar = $(this),
						end = bar.attr("data-to");

					if ( !bar.hasClass( "animated-first" ) && isScrolledIntoView( bar ) ) {
						bar.find('.progress-bar-linear').css({width: end + '%'});
						bar.find('.progress-value').countTo({
							refreshInterval: 40,
							from: 0,
							to: end,
							speed: 500
						});
						bar.addClass('animated-first');
					}
				};

			$.proxy( initProgress, bar )();
			$window.on( "scroll", $.proxy( initProgress, bar ) );
		}
	}

	// jQuery Count To
	if ( plugins.counter.length ) {
		for ( var i = 0; i < plugins.counter.length; i++ ) {
			var
				counter = $(plugins.counter[i]),
				initCount = function () {
					var counter = $(this);
					if ( !counter.hasClass( "animated-first" ) && isScrolledIntoView( counter ) ) {
						counter.countTo({
							refreshInterval: 40,
							speed: counter.attr("data-speed") || 1000
						});
						counter.addClass('animated-first');
					}
				};

			$.proxy( initCount, counter )();
			$window.on( "scroll", $.proxy( initCount, counter ) );
		}
	}

	// Lazy iframe
	if ( plugins.lazyIFrame.length ) {
		for ( var i = 0; i < plugins.lazyIFrame.length; i++ ) {
			lazyInit( $(plugins.lazyIFrame[i]), (function () {
				this.setAttribute( 'src', this.getAttribute( 'data-src' ) );
			}).bind( plugins.lazyIFrame[i] ) );
		}
	}
});


$document.ready( function () {
	isNoviBuilder = window.xMode;

	/**
	 * Google map function for getting latitude and longitude
	 */
	function getLatLngObject(str, marker, map, callback) {
		var coordinates = {};
		try {
			coordinates = JSON.parse(str);
			callback(new google.maps.LatLng(
				coordinates.lat,
				coordinates.lng
			), marker, map)
		} catch (e) {
			map.geocoder.geocode({'address': str}, function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					var latitude = results[0].geometry.location.lat();
					var longitude = results[0].geometry.location.lng();

					callback(new google.maps.LatLng(
						parseFloat(latitude),
						parseFloat(longitude)
					), marker, map)
				}
			})
		}
	}

	/**
	 * toggleSwiperInnerVideos
	 * @description  toggle swiper videos on active slides
	 */
	function toggleSwiperInnerVideos(swiper) {
		var videos;

		$.grep(swiper.slides, function (element, index) {
			var $slide = $(element),
				video;

			if (index === swiper.activeIndex) {
				videos = $slide.find("video");
				if (videos.length) {
					videos.get(0).play();
				}
			} else {
				$slide.find("video").each(function () {
					this.pause();
				});
			}
		});
	}

	/**
	 * toggleSwiperCaptionAnimation
	 * @description  toggle swiper animations on active slides
	 */
	function toggleSwiperCaptionAnimation(swiper) {
		if (isIE && isIE < 10) {
			return;
		}

		var prevSlide = $(swiper.container),
			nextSlide = $(swiper.slides[swiper.activeIndex]);

		prevSlide
			.find("[data-caption-animate]")
			.each(function () {
				var $this = $(this);
				$this
					.removeClass("animated")
					.removeClass($this.attr("data-caption-animate"))
					.addClass("not-animated");
			});

		nextSlide
			.find("[data-caption-animate]")
			.each(function () {
				var $this = $(this),
					delay = $this.attr("data-caption-delay");

				setTimeout(function () {
					$this
						.removeClass("not-animated")
						.addClass($this.attr("data-caption-animate"))
						.addClass("animated");
				}, delay ? parseInt(delay) : 0);
			});
	}

	/**
	 * makeParallax
	 * @description  create swiper parallax scrolling effect
	 */
	function makeParallax(el, speed, wrapper, prevScroll) {
		var scrollY = window.scrollY || window.pageYOffset;

		if (prevScroll != scrollY) {
			prevScroll = scrollY;
			el.addClass('no-transition');
			el[0].style['transform'] = 'translate3d(0,' + -scrollY * (1 - speed) + 'px,0)';
			el.height();
			el.removeClass('no-transition');

			if (el.attr('data-fade') === 'true') {
				var bound = el[0].getBoundingClientRect(),
					offsetTop = bound.top * 2 + scrollY,
					sceneHeight = wrapper.outerHeight(),
					sceneDevider = wrapper.offset().top + sceneHeight / 2.0,
					layerDevider = offsetTop + el.outerHeight() / 2.0,
					pos = sceneHeight / 6.0,
					opacity;
				if (sceneDevider + pos > layerDevider && sceneDevider - pos < layerDevider) {
					el[0].style["opacity"] = 1;
				} else {
					if (sceneDevider - pos < layerDevider) {
						opacity = 1 + ((sceneDevider + pos - layerDevider) / sceneHeight / 3.0 * 5);
					} else {
						opacity = 1 - ((sceneDevider - pos - layerDevider) / sceneHeight / 3.0 * 5);
					}
					el[0].style["opacity"] = opacity < 0 ? 0 : opacity > 1 ? 1 : opacity.toFixed(2);
				}
			}
		}

		requestAnimationFrame(function () {
			makeParallax(el, speed, wrapper, prevScroll);
		});
	}

	/**
	 * attachFormValidator
	 * @description  attach form validation to elements
	 */
	function attachFormValidator(elements) {
		for (var i = 0; i < elements.length; i++) {
			var o = $(elements[i]), v;
			o.addClass("form-control-has-validation").after("<span class='form-validation'></span>");
			v = o.parent().find(".form-validation");
			if (v.is(":last-child")) {
				o.addClass("form-control-last-child");
			}
		}

		elements
			.on('input change propertychange blur', function (e) {
				var $this = $(this), results;

				if (e.type !== "blur") {
					if (!$this.parent().hasClass("has-error")) {
						return;
					}
				}

				if ($this.parents('.rd-mailform').hasClass('success')) {
					return;
				}

				if ((results = $this.regula('validate')).length) {
					for (i = 0; i < results.length; i++) {
						$this.siblings(".form-validation").text(results[i].message).parent().addClass("has-error")
					}
				} else {
					$this.siblings(".form-validation").text("").parent().removeClass("has-error")
				}
			})
			.regula('bind');

		var regularConstraintsMessages = [
			{
				type: regula.Constraint.Required,
				newMessage: "El campo de texto es requerido."
			},
			{
				type: regula.Constraint.Email,
				newMessage: "El correo electrónico no es válido."
			},
			{
				type: regula.Constraint.Numeric,
				newMessage: "Sólo se admiten números"
			},
			{
				type: regula.Constraint.Selected,
				newMessage: "Por favor escoja una opción."
			}
		];

		for (var i = 0; i < regularConstraintsMessages.length; i++) {
			var regularConstraint = regularConstraintsMessages[i];

			regula.override({
				constraintType: regularConstraint.type,
				defaultMessage: regularConstraint.newMessage
			});
		}
	}

	/**
	 * isValidated
	 * @description  check if all elemnts pass validation
	 */
	function isValidated(elements, captcha) {
		var results, errors = 0;

		if (elements.length) {
			for (j = 0; j < elements.length; j++) {

				var $input = $(elements[j]);
				if ((results = $input.regula('validate')).length) {
					for (k = 0; k < results.length; k++) {
						errors++;
						$input.siblings(".form-validation").text(results[k].message).parent().addClass("has-error");
					}
				} else {
					$input.siblings(".form-validation").text("").parent().removeClass("has-error")
				}
			}

			if (captcha) {
				if (captcha.length) {
					return validateReCaptcha(captcha) && errors == 0
				}
			}

			return errors == 0;
		}
		return true;
	}

	/**
	 * validateReCaptcha
	 * @description  validate google reCaptcha
	 */
	function validateReCaptcha(captcha) {
		var captchaToken = captcha.find('.g-recaptcha-response').val();

		if (captchaToken.length === 0) {
			captcha
				.siblings('.form-validation')
				.html('Please, prove that you are not robot.')
				.addClass('active');
			captcha
				.closest('.form-group')
				.addClass('has-error');

			captcha.on('propertychange', function () {
				var $this = $(this),
					captchaToken = $this.find('.g-recaptcha-response').val();

				if (captchaToken.length > 0) {
					$this
						.closest('.form-group')
						.removeClass('has-error');
					$this
						.siblings('.form-validation')
						.removeClass('active')
						.html('');
					$this.off('propertychange');
				}
			});

			return false;
		}

		return true;
	}

	/**
	 * onloadCaptchaCallback
	 * @description  init google reCaptcha
	 */
	window.onloadCaptchaCallback = function () {
		for (i = 0; i < plugins.captcha.length; i++) {
			var $capthcaItem = $(plugins.captcha[i]);

			grecaptcha.render(
				$capthcaItem.attr('id'),
				{
					sitekey: $capthcaItem.attr('data-sitekey'),
					size: $capthcaItem.attr('data-size') ? $capthcaItem.attr('data-size') : 'normal',
					theme: $capthcaItem.attr('data-theme') ? $capthcaItem.attr('data-theme') : 'light',
					callback: function (e) {
						$('.recaptcha').trigger('propertychange');
					}
				}
			);
			$capthcaItem.after("<span class='form-validation'></span>");
		}
	};

	/**
	 * IE Polyfills
	 * @description  Adds some loosing functionality to IE browsers
	 */
	if (isIE) {
		if (isIE < 10) $html.addClass("lt-ie-10");
		if (isIE < 11) $html.addClass("ie-10");
		if (isIE === 11) $("html").addClass("ie-11");
		if (isIE === 12) $("html").addClass("ie-edge");
	}

	/**
	 * Swiper 3.1.7
	 * @description  Enable Swiper Slider
	 */
	if (plugins.swiper.length) {
		plugins.swiper.each(function () {
			var slider = $(this),
				pag      = slider.find(".swiper-pagination"),
				next     = slider.find(".swiper-button-next"),
				prev     = slider.find(".swiper-button-prev"),
				bar      = slider.find(".swiper-scrollbar"),
				parallax = slider.parents('.rd-parallax').length;

			slider.find(".swiper-slide")
				.each( function () {
					var $this = $(this), url;
					if ( url = $this.attr("data-slide-bg") ) {
						$this.css({
							"background-image": "url(" + url + ")",
							"background-size": "cover"
						})
					}

				})
				.end()
				.find("[data-caption-animate]")
				.addClass("not-animated")
				.end()
				.swiper({
					autoplay:                 !isNoviBuilder && $.isNumeric( slider.attr( 'data-autoplay' ) ) ? slider.attr( 'data-autoplay' ) : false,
					direction:                slider.attr('data-direction') || "horizontal",
					effect:                   slider.attr('data-slide-effect') || "slide",
					speed:                    slider.attr('data-slide-speed') || 600,
					keyboardControl:          !isNoviBuilder ? slider.attr('data-keyboard') === "true" : false,
					mousewheelControl:        !isNoviBuilder ? slider.attr('data-mousewheel') === "true" : false,
					mousewheelReleaseOnEdges: slider.attr('data-mousewheel-release') === "true",
					nextButton:               next.length ? next.get(0) : null,
					prevButton:               prev.length ? prev.get(0) : null,
					pagination:               pag.length ? pag.get(0) : null,
					simulateTouch:            false,
					paginationClickable:      pag.length ? pag.attr("data-clickable") !== "false" : false,
					paginationBulletRender:   pag.length ? pag.attr("data-index-bullet") === "true" ? function ( index, className ) {
						return '<span class="'+ className +'">'+ (index + 1) +'</span>';
					} : null : null,
					scrollbar:                bar.length ? bar.get(0) : null,
					scrollbarDraggable:       bar.length ? bar.attr("data-draggable") !== "false" : true,
					scrollbarHide:            bar.length ? bar.attr("data-draggable") === "false" : false,
					loop:                     !isNoviBuilder ? slider.attr('data-loop') !== "false" : false,
					loopAdditionalSlides:     0,
					loopedSlides:             0,
					onTransitionStart: function ( swiper ) {
						if( !isNoviBuilder ) toggleSwiperInnerVideos( swiper );
					},
					onTransitionEnd: function ( swiper ) {
						if( !isNoviBuilder ) toggleSwiperCaptionAnimation( swiper );
						$(window).trigger("resize");
					},

					onInit: function ( swiper ) {
						if( !isNoviBuilder ) toggleSwiperInnerVideos( swiper );
						if( !isNoviBuilder ) toggleSwiperCaptionAnimation( swiper );

						// Create parallax effect on swiper caption
						slider.find(".swiper-parallax")
							.each( function () {
								var $this = $(this), speed;

								if ( parallax && !isIE && !isMobile ) {
									if ( speed = $this.attr("data-speed") ) {
										makeParallax( $this, speed, slider, false );
									}
								}
							});
						$(window).on('resize', function () {
							swiper.update(true);
						})
					},
					onSlideChangeStart: function (swiper) {
						if ( isNoviBuilder ) return;

						var activeSlideIndex = swiper.activeIndex,
							slidesCount = swiper.slides.not(".swiper-slide-duplicate").length,
							thumbsToShow = 3;

						//If there is not enough slides
						if ( slidesCount < thumbsToShow ) return false;

						//Fix index count
						if ( activeSlideIndex === slidesCount + 1 ) activeSlideIndex = 1;
						else if ( activeSlideIndex === 0 ) activeSlideIndex = slidesCount;

						//Lopp that adds background to thumbs
						for (var i = -thumbsToShow; i < thumbsToShow + 1; i++) {
							if ( i === 0 ) continue;

							//Previous btn thumbs
							if ( i < 0 ) {
								//If there is no slides before current
								if ( ( activeSlideIndex + i - 1) < 0 ) {
									$(swiper.container).find( '.swiper-button-prev .preview__img-'+ Math.abs(i) )
										.css("background-image", "url(" + swiper.slides[slidesCount + i + 1].getAttribute("data-preview-bg") + ")");
								} else {
									$(swiper.container).find( '.swiper-button-prev .preview__img-'+ Math.abs(i) )
										.css("background-image", "url(" + swiper.slides[activeSlideIndex + i].getAttribute("data-preview-bg") + ")");
								}

								//Next btn thumbs
							} else {
								//If there is no slides after current
								if ( activeSlideIndex + i - 1 > slidesCount ) {
									$(swiper.container).find('.swiper-button-next .preview__img-' + i)
										.css("background-image", "url(" + swiper.slides[i].getAttribute("data-preview-bg") + ")");
								} else {
									$(swiper.container).find('.swiper-button-next .preview__img-' + i)
										.css("background-image", "url(" + swiper.slides[activeSlideIndex + i].getAttribute("data-preview-bg") + ")");
								}
							}
						}
					},
				});

			$(window)
				.load(function () {
					slider.find("video").each(function () {
						if (!$(this).parents(".swiper-slide-active").length) {
							this.pause();
						}
					});
				})
				.trigger("resize");
		});
	}

	/**
	 * Copyright Year
	 * @description  Evaluates correct copyright year
	 */
	if ( plugins.copyrightYear.length ) {
		plugins.copyrightYear.text( initialDate.getFullYear() );
	}

	/**
	 * Google maps
	 */
	if( plugins.maps.length ) {
		var key;

		for ( var i = 0; i < plugins.maps.length; i++ ) {
			if ( plugins.maps[i].hasAttribute( "data-key" ) ) {
				key = plugins.maps[i].getAttribute( "data-key" );
				break;
			}
		}

		$.getScript('//maps.google.com/maps/api/js?'+ ( key ? 'key='+ key + '&' : '' ) +'sensor=false&libraries=geometry,places&v=3.7', function () {
			var head = document.getElementsByTagName('head')[0],
				insertBefore = head.insertBefore;

			head.insertBefore = function (newElement, referenceElement) {
				if (newElement.href && newElement.href.indexOf('//fonts.googleapis.com/css?family=Roboto') !== -1 || newElement.innerHTML.indexOf('gm-style') !== -1) {
					return;
				}
				insertBefore.call(head, newElement, referenceElement);
			};
			var geocoder = new google.maps.Geocoder;
			for (var i = 0; i < plugins.maps.length; i++) {
				var zoom = parseInt(plugins.maps[i].getAttribute("data-zoom"), 10) || 11;
				var styles = plugins.maps[i].hasAttribute('data-styles') ? JSON.parse(plugins.maps[i].getAttribute("data-styles")) : [];
				var center = plugins.maps[i].getAttribute("data-center") || "New York";

				// Initialize map
				var map = new google.maps.Map(plugins.maps[i].querySelectorAll(".google-map")[0], {
					zoom: zoom,
					styles: styles,
					scrollwheel: false,
					center: {lat: 0, lng: 0}
				});

				// Add map object to map node
				plugins.maps[i].map = map;
				plugins.maps[i].geocoder = geocoder;
				plugins.maps[i].google = google;

				// Get Center coordinates from attribute
				getLatLngObject(center, null, plugins.maps[i], function (location, markerElement, mapElement) {
					mapElement.map.setCenter(location);
				});

				// Add markers from google-map-markers array
				var markerItems = plugins.maps[i].querySelectorAll(".google-map-markers li");

				if (markerItems.length){
					var markers = [];
					for (var j = 0; j < markerItems.length; j++){
						var markerElement = markerItems[j];
						getLatLngObject(markerElement.getAttribute("data-location"), markerElement, plugins.maps[i], function(location, markerElement, mapElement){
							var icon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
							var activeIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active");
							var info = markerElement.getAttribute("data-description") || "";
							var infoWindow = new google.maps.InfoWindow({
								content: info
							});
							markerElement.infoWindow = infoWindow;
							var markerData = {
								position: location,
								map: mapElement.map
							}
							if (icon){
								markerData.icon = icon;
							}
							var marker = new google.maps.Marker(markerData);
							markerElement.gmarker = marker;
							markers.push({markerElement: markerElement, infoWindow: infoWindow});
							marker.isActive = false;
							// Handle infoWindow close click
							google.maps.event.addListener(infoWindow,'closeclick',(function(markerElement, mapElement){
								var markerIcon = null;
								markerElement.gmarker.isActive = false;
								markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon");
								markerElement.gmarker.setIcon(markerIcon);
							}).bind(this, markerElement, mapElement));


							// Set marker active on Click and open infoWindow
							google.maps.event.addListener(marker, 'click', (function(markerElement, mapElement) {
								if (markerElement.infoWindow.getContent().length === 0) return;
								var gMarker, currentMarker = markerElement.gmarker, currentInfoWindow;
								for (var k =0; k < markers.length; k++){
									var markerIcon;
									if (markers[k].markerElement === markerElement){
										currentInfoWindow = markers[k].infoWindow;
									}
									gMarker = markers[k].markerElement.gmarker;
									if (gMarker.isActive && markers[k].markerElement !== markerElement){
										gMarker.isActive = false;
										markerIcon = markers[k].markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")
										gMarker.setIcon(markerIcon);
										markers[k].infoWindow.close();
									}
								}

								currentMarker.isActive = !currentMarker.isActive;
								if (currentMarker.isActive) {
									if (markerIcon = markerElement.getAttribute("data-icon-active") || mapElement.getAttribute("data-icon-active")){
										currentMarker.setIcon(markerIcon);
									}

									currentInfoWindow.open(map, marker);
								}else{
									if (markerIcon = markerElement.getAttribute("data-icon") || mapElement.getAttribute("data-icon")){
										currentMarker.setIcon(markerIcon);
									}
									currentInfoWindow.close();
								}
							}).bind(this, markerElement, mapElement))
						})
					}
				}
			}
		});
	}

	/**
	 * RD Input Label
	 * @description Enables RD Input Label Plugin
	 */
	if (plugins.rdInputLabel.length) {
		plugins.rdInputLabel.RDInputLabel();
	}

	/**
	 * Regula
	 * @description Enables Regula plugin
	 */
	if (plugins.regula.length) {
		attachFormValidator(plugins.regula);
	}

	/**
	 * WOW
	 * @description Enables Wow animation plugin
	 */
	if ( !isNoviBuilder && $html.hasClass('desktop') && $html.hasClass("wow-animation") && $(".wow").length ) {
		new WOW().init();
	}

	/**
	 * Text Rotator
	 * @description Enables Text Rotator plugin
	 */
	if ( !isNoviBuilder && plugins.textRotator.length ) {
		for ( var i = 0; i < plugins.textRotator.length; i++ ) {
			$(plugins.textRotator[i]).rotator();
		}
	}

	/**
	 * Owl carousel
	 * @description Enables Owl carousel plugin
	 */
	if ( plugins.owl.length ) {
		for ( var n = 0; n < plugins.owl.length; n++ ) {
			var carousel = $(plugins.owl[n]),
				responsive = {},
				aliaces = ["-xs-", "-sm-", "-md-", "-lg-", "-xl-", "-xxl-"],
				values = [0, 480, 768, 992, 1200, 1600];

			for ( var i = 0; i < values.length; i++ ) {
				responsive[values[i]] = {};
				for ( var j = i; j >= -1; j-- ) {
					if (!responsive[values[i]]["items"] && carousel.attr("data" + aliaces[j] + "items")) {
						responsive[values[i]]["items"] = j < 0 ? 1 : parseInt(carousel.attr("data" + aliaces[j] + "items"));
					}
					if (!responsive[values[i]]["stagePadding"] && responsive[values[i]]["stagePadding"] !== 0 && carousel.attr("data" + aliaces[j] + "stage-padding")) {
						responsive[values[i]]["stagePadding"] = j < 0 ? 0 : parseInt(carousel.attr("data" + aliaces[j] + "stage-padding"));
					}
					if (!responsive[values[i]]["margin"] && responsive[values[i]]["margin"] !== 0 && carousel.attr("data" + aliaces[j] + "margin")) {
						responsive[values[i]]["margin"] = j < 0 ? 30 : parseInt(carousel.attr("data" + aliaces[j] + "margin"));
					}
					if (!responsive[values[i]]["dotsEach"] && responsive[values[i]]["dotsEach"] !== 0 && carousel.attr("data" + aliaces[j] + "dots-each")) {
						responsive[values[i]]["dotsEach"] = j < 0 ? false : parseInt(carousel.attr("data" + aliaces[j] + "dots-each"));
					}
				}
			}

			// Create custom Pagination
			if (carousel.attr('data-dots-custom')) {
				carousel.on("initialized.owl.carousel", function (event) {
					var carousel = $(event.currentTarget),
						customPag = $(carousel.attr("data-dots-custom")),
						active = 0;

					if (carousel.attr('data-active')) {
						active = parseInt(carousel.attr('data-active'));
					}

					carousel.trigger('to.owl.carousel', [active, 300, true]);
					customPag.find("[data-owl-item='" + active + "']").addClass("active");

					customPag.find("[data-owl-item]").on('click', function (e) {
						e.preventDefault();
						carousel.trigger('to.owl.carousel', [parseInt(this.getAttribute("data-owl-item")), 300, true]);
					});

					carousel.on("translate.owl.carousel", function (event) {
						customPag.find(".active").removeClass("active");
						customPag.find("[data-owl-item='" + event.item.index + "']").addClass("active")
					});
				});
			}

			// Create custom Navigation
			if (carousel.attr('data-nav-custom')) {
				carousel.on("initialized.owl.carousel", function (event) {
					var carousel = $(event.currentTarget),
						customNav = $(carousel.attr("data-nav-custom"));

					customNav.find("[data-owl-prev]").on('click', function (e) {
						e.preventDefault();
						carousel.trigger('prev.owl.carousel', [300]);
					});

					customNav.find("[data-owl-next]").on('click', function (e) {
						e.preventDefault();
						carousel.trigger('next.owl.carousel', [300]);
					});
				});
			}

			carousel.owlCarousel({
				autoplay: !isNoviBuilder ? carousel.attr("data-autoplay") === "true" : false,
				loop: !isNoviBuilder ? carousel.attr("data-loop") === "true" : false,
				items: 1,
				autoplaySpeed: 600,
				autoplayTimeout: 3000,
				dotsContainer: carousel.attr("data-pagination-class") || false,
				navContainer: carousel.attr("data-navigation-class") || false,
				mouseDrag: !isNoviBuilder ? carousel.attr("data-mouse-drag") === "true" : false,
				nav: carousel.attr("data-nav") === "true",
				dots: carousel.attr("data-dots") === "true",
				dotsEach: carousel.attr("data-dots-each") ? parseInt(carousel.attr("data-dots-each")) : false,
				responsive: responsive,
				animateOut: carousel.attr("data-animation-out") || false,
				navText: carousel.attr("data-nav-text") ? $.parseJSON( carousel.attr("data-nav-text") ) : [],
				navClass: carousel.attr("data-nav-class") ? $.parseJSON( carousel.attr("data-nav-class") ) : ['owl-prev', 'owl-next']
				});
		}
	}

	/**
	 * RD Navbar
	 * @description Enables RD Navbar plugin
	 */
	if ( plugins.rdNavbar.length ) {
		var navbar = plugins.rdNavbar,
			aliases = { '0':'-', '480':'-xs-', '768':'-sm-', '992':'-md-', '1200':'-lg-' },
			responsiveNavbar = {};

		for ( var alias in aliases ) {
			responsiveNavbar[ alias ] = {};
			if ( navbar.attr( 'data'+ aliases[ alias ] +'layout' ) ) responsiveNavbar[ alias ].layout = navbar.attr( 'data'+ aliases[ alias ] +'layout' );
			else responsiveNavbar[ alias ].layout = 'rd-navbar-fixed';
			if ( navbar.attr( 'data'+ aliases[ alias ] +'device-layout' ) ) responsiveNavbar[ alias ].deviceLayout = navbar.attr( 'data'+ aliases[ alias ] +'device-layout' );
			else responsiveNavbar[ alias ].deviceLayout = 'rd-navbar-fixed';
			if ( navbar.attr( 'data'+ aliases[ alias ] +'hover-on' ) ) responsiveNavbar[ alias ].focusOnHover = navbar.attr( 'data'+ aliases[ alias ] +'hover-on' ) === 'true';
			if ( navbar.attr( 'data'+ aliases[ alias ] +'auto-height' ) ) responsiveNavbar[ alias ].autoHeight = navbar.attr( 'data'+ aliases[ alias ] +'auto-height' ) === 'true';
			if ( navbar.attr( 'data'+ aliases[ alias ] +'stick-up-offset' ) ) responsiveNavbar[ alias ].stickUpOffset = navbar.attr( 'data'+ aliases[ alias ] +'stick-up-offset');
			if ( navbar.attr( 'data'+ aliases[ alias ] +'stick-up' ) && !isNoviBuilder ) responsiveNavbar[ alias ].stickUp = navbar.attr( 'data'+ aliases[ alias ] +'stick-up' ) === 'true';
			else responsiveNavbar[ alias ].stickUp = false;

			if ( $.isEmptyObject( responsiveNavbar[ alias ] ) ) delete responsiveNavbar[ alias ];
		}

		navbar.RDNavbar({
			stickUpClone: ( !isNoviBuilder && navbar.attr("data-stick-up-clone") ) ? navbar.attr("data-stick-up-clone") === 'true' : false,
			stickUpOffset: ( navbar.attr("data-stick-up-offset") ) ? navbar.attr("data-stick-up-offset") : 1,
			anchorNavOffset: -78,
			anchorNav: !isNoviBuilder,
			anchorNavEasing: 'linear',
			focusOnHover: !isNoviBuilder,
			responsive: responsiveNavbar,
			onDropdownOver: function () {
				return !isNoviBuilder;
			}
		});
	}

	/**
	 * UI To Top
	 * @description Enables ToTop Button
	 */
	if ( !isNoviBuilder && isDesktop ) {
		$().UItoTop({
			easingType: 'easeOutQuart',
			containerClass: 'ui-to-top icon icon-xs icon-circle icon-darker-filled mdi mdi-chevron-up'
		});
	}

	/**
	 * Google ReCaptcha
	 * @description Enables Google ReCaptcha
	 */
	if (plugins.captcha.length) {
		$.getScript("//www.google.com/recaptcha/api.js?onload=onloadCaptchaCallback&render=explicit&hl=en");
	}

	/**
	 * RD Mailform
	 */
	if (plugins.rdMailForm.length) {
		var i, j, k,
			msg = {
				'MF000': 'Gracias. Dios te bendiga!',
				'MF001': 'Recipients are not set!',
				'MF002': 'Form will not work locally!',
				'MF003': 'Please, define email field in your form!',
				'MF004': 'Please, define type of your form!',
				'MF254': 'Something went wrong with PHPMailer!',
				'MF255': 'Aw, snap! Something went wrong.'
			};

		for (i = 0; i < plugins.rdMailForm.length; i++) {
			var $form = $(plugins.rdMailForm[i]),
				formHasCaptcha = false;

			$form.attr('novalidate', 'novalidate').ajaxForm({
				data: {
					"form-type": $form.attr("data-form-type") || "contact",
					"counter": i
				},
				beforeSubmit: function (arr, $form, options) {

					var form = $(plugins.rdMailForm[this.extraData.counter]),
						inputs = form.find("[data-constraints]"),
						output = $("#" + form.attr("data-form-output")),
						captcha = form.find('.recaptcha'),
						captchaFlag = true;

					output.removeClass("active error success");

					if (isValidated(inputs, captcha)) {

						// veify reCaptcha
						if (captcha.length) {
							var captchaToken = captcha.find('.g-recaptcha-response').val(),
								captchaMsg = {
									'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
									'CPT002': 'Something wrong with google reCaptcha'
								};

							formHasCaptcha = true;

							$.ajax({
								method: "POST",
								url: "bat/reCaptcha.php",
								data: {'g-recaptcha-response': captchaToken},
								async: false
							}).done(function (responceCode) {
								if (responceCode !== 'CPT000') {
									if (output.hasClass("snackbars")) {
										output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + captchaMsg[responceCode] + '</span></p>')

										setTimeout(function () {
											output.removeClass("active");
										}, 3500);

										captchaFlag = false;
									} else {
										output.html(captchaMsg[responceCode]);
									}

									output.addClass("active");
								}
							});
						}

						if (!captchaFlag) {
							return false;
						}

						form.addClass('form-in-process');

						if (output.hasClass("snackbars")) {
							output.html('<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Gracias. ¡Dios te bendiga!</span></p>');
							output.addClass("active");
						}
					} else {
						return false;
					}
				},
				error: function (result) {

					var output = $("#" + $(plugins.rdMailForm[this.extraData.counter]).attr("data-form-output")),
						form = $(plugins.rdMailForm[this.extraData.counter]);

					output.text(msg[result]);
					form.removeClass('form-in-process');

					if (formHasCaptcha) {
						grecaptcha.reset();
					}
				},
				success: function (result) {

					var form = $(plugins.rdMailForm[this.extraData.counter]),
						output = $("#" + form.attr("data-form-output")),
						select = form.find('select');

					form
						.addClass('success')
						.removeClass('form-in-process');

					if (formHasCaptcha) {
						grecaptcha.reset();
					}

					result = result.length === 5 ? result : 'MF255';
					output.text(msg[result]);

					if (result === "MF000") {
						if (output.hasClass("snackbars")) {
							output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + msg[result] + '</span></p>');
						} else {
							output.addClass("active success");
						}
					} else {
						if (output.hasClass("snackbars")) {
							output.html(' <p class="snackbars-left"><span class="icon icon-xxs mdi mdi-alert-outline text-middle"></span><span>' + msg[result] + '</span></p>');
						} else {
							output.addClass("active error");
						}
					}

					form.clearForm();

					if (select.length) {
						select.select2("val", "");
					}

					form.find('input, textarea').trigger('blur');

					setTimeout(function () {
						output.removeClass("active error success");
						form.removeClass('success');
					}, 3500);
				}
			});
		}
	}

	/**
	 * Material Parallax
	 * @description Enables Material Parallax plugin
	 */
	if ( plugins.materialParallax.length ) {
		if ( !isNoviBuilder && !isIE && !isMobile) {
			plugins.materialParallax.parallax();
		} else {
			for ( var i = 0; i < plugins.materialParallax.length; i++ ) {
				var $parallax = $(plugins.materialParallax[i]);

				$parallax.addClass( 'parallax-disabled' );
				$parallax.css({ "background-image": 'url('+ $parallax.data("parallax-img") +')' });
			}
		}
	}

	/**
	 * Background Video
	 * @description  Enable Video plugin
	 */
	if ( plugins.videBG.length ) {
		for( var i =0; i < plugins.videBG.length; i++ ) {
			var $element = $(plugins.videBG[i]),
				options = $element.data('vide-options'),
				path = $element.data('vide-bg');
			$element.vide( path, options );
		}
	}
});

/*radio*/

/* Wavestreaming.com - https://github.com/Wavestreaming/jquery-shoutcast - MIT licensed */
!function(a){"use strict";function b(a){this._attr={},this.playedInterval=a.playedInterval||a.interval||3e4,this.statsInterval=a.statsInterval||a.interval||5e3,this.host=a.host,this.port=parseInt(a.port,10)||8e3,this.stream=parseInt(a.stream,10)||1,this.stats_path=a.stats_path||"stats",this.played_path=a.played_path||"played",this._statsinterval=null,this._playedinterval=null,this._stats=a.stats||function(){},this._played=a.played||function(){}}b.prototype.get=function(a,b){return a?"undefined"!=typeof this._attr[a.toLowerCase()]?this._attr[a.toLowerCase()]:b:this._attr},b.prototype.stats=function(b){var c,d=this,e="https://"+this.host+":"+this.port+"/"+this.stats_path+"?sid="+this.stream+"&json=1";return b=b||function(){},c=a.ajax({url:e,dataType:"jsonp",timeout:"2000"}),c.done(function(a){return"object"!=typeof a||"undefined"==typeof a.streamstatus?void(d._status=0):(d._status=1===a.streamstatus?2:1,d._attr=a,d._attr.status=d.getStatusAsText(),b.call(d,d._attr),void d._stats(d._attr))}),c.fail(function(){d._status=0,d._attr.status=d.getStatusAsText(),b.call(d,d._attr),d._stats(d._attr)}),this},b.prototype.played=function(b){var c=this,d="https://"+this.host+":"+this.port+"/"+this.played_path+"?sid="+this.stream+"&type=json";return a.ajax({url:d,dataType:"jsonp",timeout:2e3,success:function(a){a instanceof Array&&(b&&b.call(c,a),c._played(a))}}),this},b.prototype.startStats=function(){return this.stopStats(),this.stats(),this._statsinterval=setInterval(a.proxy(this.stats,this),this.statsInterval),this},b.prototype.stopStats=function(){return this._statsinterval&&clearInterval(this._statsinterval),this},b.prototype.startPlayed=function(){return this.stopPlayed(),this.played(),this._playedinterval=setInterval(a.proxy(this.played,this),this.playedInterval),this},b.prototype.stopPlayed=function(){return this._playedinterval&&clearInterval(this._playedinterval),this},b.prototype.getStatus=function(){return this._status},b.prototype.getStatusAsText=function(){return["Offline","Awaiting Connection","On Air"][this._status]},b.prototype.onAir=function(){return 2===this._status},a.SHOUTcast=function(a){return new b(a)}}(window.jQuery);

var host  	      = 'rockfm.rockfm.com.tr',
    port	        = '9450',
    yenileme	    = 1000,
    radyo_url	    = `https://${ host }:${ port }/;stream.mp3`,
    logo          = 'https://www.rockfm.com.tr/images/rockfm_logo_siyah-bg.png',
    spotify_token = '';

$(".liste").click(function(){
  $("#gecmis").slideToggle();
});

var player = new MediaElementPlayer('audio');
interval = setInterval(function(){
  $.SHOUTcast({
    host      : host,
    port      : port,
    interval  : 5000
  }).stats(function(){
    if(this.onAir()){
      $("#player, #gecmis").removeClass("offline").addClass("online");
      radyoismi		= this.get("servertitle");
      calansarki	= this.get("songtitle");
      $("#mesaj marquee").text('Şu anda bu yayını ' + this.get('currentlisteners') + ' kişi dinliyor!');
      $("#icerik p").html();
      if(radyoismi.length >= 50){
        radyoismi = radyoismi.substr(0,50);
      }
      if(calansarki.length >= 50){
        calansarki = calansarki.substr(0,50);
      }
      $(".radyo strong").text(radyoismi);
      $(".sarki span").text(calansarki);
      $.ajax({
        dataType  : 'json',
        url       : `https://api.spotify.com/v1/search?q=${ calansarki }&type=track`,
        headers   : {   
          'Authorization:' : `Bearer ${ spotify_token }`
        },
        success   : function(response){
          console.log(response)
          $("#icerik").css('background-image', 'url(' + response.tracks.items[0].album.images[0].url + ')');
          $("#kapak img").attr('src', response.tracks.items[0].album.images[2].url);
        }
      });

    }else{
      // Yayın kapalı
      $("#player, #gecmis").removeClass("online").addClass("offline");
      $(".radyo strong").text("Rock FM");
      $(".sarki span").text("Yayın şu anda kapalı.");
      $("#kapak img").attr("src", logo);
    }
  }).played(function(tracks){
    $("#gecmis").html("");
    $.each(tracks, function(k,track){
      $("#gecmis").append('<li><i class="fa fa-music"></i> ' + track.title + '</li>');
    });
  });
}, 1000);

$("#kontrol").click(function(){
  icon = $(this).find("i");
  if(icon.attr('class') == 'fa fa-play'){
    player.play();
    icon.attr('class', 'glyphicon glyphicon-pause');
  }else{
    player.pause();
    icon.attr('class', 'fa fa-play');
  }
});

$(".yenile").click(function(){
  player.setSrc(radyo_url);
});

$(".sessiz").click(function(){
  icon = $(this).find('i');
  if(icon.attr('class') == 'fa fa-volume-up'){
    icon.attr('class', 'fa fa-volume-off');
    player.setMuted(true);
  }else{
    icon.attr('class', 'fa fa-volume-up');
    player.setMuted(false);
  }
});

$('[data-toggle=tooltip]').tooltip();
