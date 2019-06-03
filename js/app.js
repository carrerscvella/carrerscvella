var carrers = 'data/carrers.geojson';
var COLS = 'data/columns.json'
var fcarrers;
var columns;
var nomCarrer = 'c_nom_carrer_actual';

var filters = {
	//	'c_infraestructura': [],
	//	'c_edificacio': [],
	//	'c_ofici': [],
	//	'c_institucio': [],
	//	'c_mercat': [],
	//	'c_periode': [],
	//	'c_segle': [],
	//	'c_barri': [],
	'c_tipologia': [],
	'c_subtipologia': [],
	'c_genere': []
};

var filters_n = {
	//	'c_infraestructura': 'Infraestructura',
	//	'c_edificacio': "Tiups d'edificació",
	//	'c_ofici': "Ofici",
	//	'c_institucio': "Institució",
	//	'c_mercat': "Mercats",
	//	'c_periode': "Periodes",
	//	'c_segle': "Segle",
	//	'c_barri': "Barri",
	'c_tipologia': "Tipologia",
	'c_subtipologia': "Subtipologia",
	'c_genere': "Gènere"
};

var TC = 601;
var FEATURES = []; //listado de las features filtradas
var FEATURES_SEL = [];
var FEATURES_TOT = [];
var p_m = 2;
var p_f = 3;
var syncview = false;

/*----------*/

function style(feat, resolution) {
	var st;
	if (FEATURES.indexOf(feat.values_.c_carrer_id) == -1) {
		st = [new ol.style.Style({
			zIndex: 1,
			stroke: new ol.style.Stroke({
				color: 'rgba(255,0,0,0.5)',
				//width: 3 / resolution,
				width: 0.5,
				lineJoin: 'round',
				lineCap: 'round',
				lineDashOffset: 0,
				lineDash: [0],
			}),
		}), ]
	} else {
		st = [new ol.style.Style({
				zIndex: 2,
				stroke: new ol.style.Stroke({
					color: 'rgba(255, 0, 127, 0)',
					width: 3 / resolution,
					lineJoin: 'round',
					lineCap: 'round',
					lineDashOffset: 0,
					lineDash: [0],
				}),
			}),
			 new ol.style.Style({
				zIndex: 1,
				stroke: new ol.style.Stroke({
					color: 'rgba(255, 70, 70, 0.83)',
					width: 10 / resolution,
					lineJoin: 'round',
					lineCap: 'round',
					lineDashOffset: 0,
					lineDash: [0],
				}),
			}), ]
	}
	return st
}

function selectStyle(feat, resolution) {
	var st;

	st = [new ol.style.Style({
			zIndex: 9,
			stroke: new ol.style.Stroke({
				color: 'rgba(255, 0, 0, 0.52)',
				width: 20 / resolution,
				lineJoin: 'round',
				lineCap: 'round',
				lineDashOffset: 0,
				lineDash: [0],
			}),
		}),
		  new ol.style.Style({
			zIndex: 10,
			stroke: new ol.style.Stroke({
				color: 'rgba(255, 255, 255, 1)',
				width: 0.8,
				lineJoin: 'round',
				lineCap: 'round',
				lineDashOffset: 0,
				lineDash: [0],
			}),
		}),
		  new ol.style.Style({
			zIndex: 10,
			image: new ol.style.Circle({
				radius: 2 / resolution,
				fill: new ol.style.Fill({
					color: 'white'
				})
			}),
			geometry: function (feature) {
				var coordinates = feature.getGeometry().getCoordinates();
				var type = feature.getGeometry().getType();
				var mp = new ol.geom.MultiPoint([], 'XY');
				if (type == 'LineString') {
					for (var c in coordinates) {
						mp.appendPoint(new ol.geom.Point(coordinates[c]));
					}
				} else {
					for (var c in coordinates) {
						for (var cc in coordinates[c]) {
							mp.appendPoint(new ol.geom.Point(coordinates[c][cc]));
						}
					}
				}
				return mp;
			}
		}),
		 ]
	return st
}


function scroll() {
	$.scrollify({
		section: "section:not(.inactive)",
		interstitialSection: ".interstitial",
		updateHash: false,
		overflowScroll: true,
		setHeights: true
	});
}

function getFeatures() {
	FEATURES_TOT = [];
	s = window.layer.getSource().getFeatures();
	$.each(s, function (i, ii) {
		var e = ii.getProperties();
		delete e['geometry'];
		FEATURES_TOT.push(e);
	});
	filtersid()
}

function filtersid() {
	where = getFilterSql();
	FEATURES = []

	if (where != '') {
		sql = 'SELECT c_carrer_id c FROM ? ' + where;
		r = alasql(sql, [FEATURES_TOT]);
		$.each(r, function (x, xx) {
			FEATURES.push(xx.c)
		})

		F = [];
		s = window.layer.getSource().getFeatures();
		s.forEach(function (feature) {
			if (FEATURES.indexOf(feature.getProperties().c_carrer_id) != -1) {
				F.push(feature)
			}
		});

		var extent = F[0].getGeometry().getExtent().slice(0);
		F.forEach(function (feature) {
			ol.extent.extend(extent, feature.getGeometry().getExtent())
		});
		window.map.getView().fit(extent, window.map.getSize());
	}

	window.layer.changed();

	//
}


function showFilters() {
	if ($('#b_filtra').hasClass('active')) {

		$('#b_filtra').removeClass('active');
		$('#filters .row').hide();

		$('#flexible').addClass('inactive');
		$('#flexible').css('display', 'none')

		$.scrollify.update();
		$.scrollify.move(p_m);

	} else { //enciende
		$('#b_filtra').addClass('active');
		$('#filters .row').show();
		h = $('#filters').height();

		$('#flexible').removeClass('inactive');
		$('#flexible').css('top', $($('section')[p_m]).offset().top + h - 40)
		$('#flexible').css('display', 'block')

		$.scrollify.update();

		setTimeout(function () {
			$.scrollify.move(p_f)
		}, 500);


	}
}

function filter() {

	// crea el filtro molon
	tt = FEATURES_TOT;

	//limpia
	$('#filters').append('<div class="row"></div>')

	$.each(Object.keys(filters), function (i, ii) {

		sql = 'SELECT ' + ii + ' , COUNT(*) AS c FROM ?  GROUP BY ' + ii + '  ORDER BY c asc';
		r = alasql(sql, [tt]);

		$('#filters .row').append('<div class="col-md-12 col-s-12 col-xl-12 "><div id="' + ii + '" class="f-title">' + filters_n[ii] + '</div>' + '<div id="' + ii + '" class="f-selector"></div></div>')
		$.each(r, function (x, xx) {
			if (xx[ii] != null) {
				$('#filters #' + ii + '.f-selector').append('<div class="f-button" value="' + xx.c + '" field="' + xx[ii] + '" col="' + ii + '"> ' + xx[ii] + ' </div>')
			}
		})
	})

	$('.f-button').click(function () {
		if ($(this).hasClass('active')) {

			$(this).removeClass('active');
			var index = filters[$(this).attr('col')].indexOf($(this).attr('field'));

			if (index > -1) {
				//array.splice(index, 1);
				filters[$(this).attr('col')].splice(index, 1);
			}

		} else {
			$(this).addClass('active');
			var index = filters[$(this).attr('col')].indexOf($(this).attr('field'));
			filters[$(this).attr('col')].push();
			if (index == -1) {
				filters[$(this).attr('col')].push($(this).attr('field'));
			}
		}

		refilter();
		filtersid();
		tableSync();
	})

	refilter();
}



function getFilterSql() {
	//separar las condiciones en or y and
	conds = {}
	$.each(filters, function (i, ii) {
		conds[i] = []
		$.each(ii, function (j, jj) {
			conds[i].push(i + " = '" + jj + "'");
		})
	});

	cs = [];
	$.each(conds, function (i, ii) {
		if (ii.length > 0) {
			cs.push('(' + ii.join(' OR ') + ')');
		}
	})

	where = cs.join(' AND ')
	if (where == '') {

	} else {
		where = ' WHERE ' + where
	}

	return where
}

function refilter() {

	/**/
	where = getFilterSql();

	var tt = [];
	s = window.layer.getSource().getFeatures();
	$.each(s, function (i, ii) {
		var e = ii.getProperties();
		delete e['geometry'];
		tt.push(e);
	});

	$.each(Object.keys(filters), function (i, ii) {
		sql = 'SELECT ' + ii + ' , COUNT(*) AS c FROM ? ' + where + ' GROUP BY ' + ii + '  ORDER BY c asc';
		r = alasql(sql, [tt]);

		var rr = {};
		$.each(r, function (e, ee) {
			rr[ee[ii]] = ee.c
		})

		$.each($('#filters #' + ii + '.f-selector .f-button'), function (x, xx) {
			var f = $(xx).attr('field');
			if (rr[f] != undefined) {
				$(xx).html(f + '<span class="f-note"> (' + rr[f] + ')</span>');
				$(xx).removeClass('inactive')
			} else {
				$(xx).html(f + '<span class="f-note"> (0)</span>');
				$(xx).addClass('inactive')
			}
		});
	})


	//resultados
	sql = 'SELECT  COUNT(*) AS c FROM ? ' + where;
	r = alasql(sql, [tt]);
	$('#n_carrers').html(r[0].c + ' carrers')

}

function map() {

	window.map = new ol.Map({
		target: 'map',
		interactions: ol.interaction.defaults({
			mouseWheelZoom: false
		}),
		view: new ol.View({
			center: ol.proj.transform([2.18096, 41.38264], 'EPSG:4326', 'EPSG:3857'),
			zoom: 15.5,
			maxZoom: 18,
			minZoom: 14,
			extent: [240743.498, 5067232.830, 244710.876, 5070899.649]
			//rotation: Math.PI / 4,
		}),
		controls: ol.control.defaults({
			attribution: false,
			//zoom: false,
			rotate: false,
		}),
	});

	var slider = new ol.control.ZoomSlider()
	slider.setTarget('zoom-map')
	window.map.addControl(slider)


	var base = new ol.source.XYZ({});
	base.setUrl('tiles/{z}/{x}/{y}.png');
	window.blayer = new ol.layer.Tile({
		source: base,
		opacity: 1,
	});

	window.layer = new ol.layer.Vector({
		style: style,
		source: new ol.source.Vector({
			features: (new ol.format.GeoJSON({
				dataProjection: 'EPSG:4326'
			})).readFeatures(fcarrers, {
				featureProjection: 'EPSG:3857'
			})
		})
	});

	window.layer.set('layer_name', 'layer')

	//grayscale
	var spotLayerSource = new ol.source.Vector({});
	window.spotLayer = new ol.layer.Vector({
		source: spotLayerSource,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: "rgba(0, 0, 0, 1)"
			}),
			fill: new ol.style.Fill({
				color: "rgba(255, 255, 255, 0.5)"
			})
		})
	});

	window.spotLayer.setOpacity(1);

	var bounds = [[236545.166, 5063073.040], [236545.166, 5073867.769], [247201.015, 5073867.769], [247201.015, 236545.166], [236545.166, 5063073.040]]
	var spot = new ol.geom.Polygon([bounds]);
	spotLayer.getSource().addFeature(new ol.Feature(spot));

	window.selectLayerSource = new ol.source.Vector({})
	window.selectLayer = new ol.layer.Vector({
		style: selectStyle,
		source: window.selectLayerSource,
	});

	var layerMaskSource = new ol.source.Vector({
		url: 'data/mask.geojson',
		format: new ol.format.GeoJSON()
	});

	window.layerMask = new ol.layer.Vector({
		source: layerMaskSource,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: "rgba(0, 0, 0, 0)"
			}),
			fill: new ol.style.Fill({
				color: "rgba(255, 255, 255, 1)"
			})
		})
	});

	//add layers
	map.addLayer(window.blayer);
	map.addLayer(window.spotLayer);
	map.addLayer(window.layer);
	map.addLayer(window.selectLayer);

	getFeatures() //construye un listado con todas los features
	filter() //inicia el filtro
	table() //dispara la tabla

	window.map.on('click', showInfo, {
		hitTolerance: 30
	});

	window.map.on('pointermove', highlight, {
		hitTolerance: 50
	});

	window.map.on('movestart', back);
}

function back() {
	$('#map_data').hide();
	window.map.on('pointermove', highlight, {
		hitTolerance: 50
	});
	window.spotLayer.setOpacity(0);
}


function buildtxt(features) {
	if (!features) {
		return null;
	} else {
		var f = features[0].getProperties();
		var txt = '';
		txt += '<div class="popup-content">';
		txt += '<div class="popup-m"><b>' + f.c_denominacio + ' ' + f.c_nom_carrer_actual + '</b></div>';
		txt += '<div class="popup-m">' + f.c_segle + '</div>';
		txt += '<div class="popup-m"><a class="identify" title="Identify" onclick="modal(\'' + f.c_carrer_id + '\')"><i class="fa fa-info-circle pop"></i></a></div>';
		txt += '</div>';
		return txt;
	}
}


function showInfo(evt) {
	$('#modal').fadeOut();
	window.map.on('pointermove', highlight, {
		hitTolerance: 50
	});

	selectLayerSource.clear();

	var features = window.map.getFeaturesAtPixel(
		evt.pixel, {
			layerFilter: function (layer) {
				if (layer.get('layer_name') == 'layer') {
					//console.log(11)
					return true
				} else {
					return false
				}
			},
			hitTolerance: 10
		}
	);


	if (features != null) {
		window.map.un('movestart', back);
		window.map.un('pointermove', highlight);
		features = features[0];

		txt = buildtxt([features]);
		selectLayerSource.addFeature(new ol.Feature({
			name: 'thing',
			geometry: features.getGeometry()
		}));

		d = 100 / window.map.getView().getResolution();
		np = [evt.pixel[0], evt.pixel[1] - d];

		coo = window.map.getCoordinateFromPixel(np);

		$('#map_data').hide();
		$('#map_data').fadeIn();
		$('#map_data').css('left', evt.pixel[0]);
		$('#map_data').css('top', evt.pixel[1])

		setTimeout(function () {
			window.map.on('movestart', back);
			window.spotLayer.setOpacity(1);
		}, 1);

		$('#map_data .content').html(txt);


	} else {
		$('#map_data .content').html(txt);
		$('#map_data').hide();

		window.spotLayer.setOpacity(0)
	}

}

function clean(t) {
	var result = t;
	if (t == undefined || t == null || t == 0) {
		result = '-'
	}
	return result
}


function modal(id) {

	window.layer.getSource().getFeatures().forEach(function (i) {
		if (i.getProperties()['c_carrer_id'] == id) {
			console.log('modal');
			$('#modal').fadeIn();
			$('#modal').click(function () {
				$('#modal').fadeOut();
			});

			f = i.getProperties()
			console.log(f)

			var txt = '';
			txt += '<div class="popup-content">'
			txt += '<div class="popup-m">' + clean(f.c_carrer_id) + '</div>'

			txt += '<div class="popup-s">barri:</div>'
			txt += '<div class="popup-m">' + clean(f.c_barri) + '</div>'

			txt += '<div class="popup-s">denominació:</div>'
			txt += '<div class="popup-m">' + clean(f.c_denominacio) + '</div>'

			txt += '<div class="popup-s">nom:</div>'
			txt += '<div class="popup-m">' + clean(f.c_nom_carrer_actual) + '</div>'

			txt += '<div class="popup-s">periode:</div>'
			txt += '<div class="popup-m">' + clean(f.c_period) + '</div>'

			txt += '<div class="popup-s">segle:</div>'
			txt += '<div class="popup-m">' + clean(f.c_segle) + '</div>'

			txt += '<div class="popup-s">datació:</div>'
			txt += '<div class="popup-m">' + clean(f.c_data_que_va_rebre_la_denominacio) + '</div>'


			txt += '<div class="popup-s">explicació:</div>'
			txt += '<div class="popup-m">' + clean(f.c_exp_historica_refos) + '</div>'

			txt += '<div class="popup-s">tipologia:</div>'
			txt += '<div class="popup-m">' + clean(f.c_tipologia) + '</div>'

			txt += '<div class="popup-s">subtipologia:</div>'
			txt += '<div class="popup-m">' + clean(f.c_subtipologia) + '</div>'

			txt += '<div class="popup-s">gènere:</div>'
			txt += '<div class="popup-m">' + clean(f.c_genere) + '</div>'

			txt += '<div class="popup-s">fonts:</div>'
			txt += '<div class="popup-m">' + clean(f.c_fonts_refos) + '</div>'

			txt += '</div>'

			$('#modal #content').html(txt)


		}
	})

}

function highlightClick(c_carrer_id) {
	selectLayerSource.clear();

	window.layer.getSource().getFeatures().forEach(function (i, ii) {
		if (i.getProperties()['c_carrer_id'] == c_carrer_id) {
			feature = i
		}
	});
	window.map.un('movestart', back);
	window.map.un('pointermove', highlight);

	//destaca el c_carrer_id
	features = feature
	txt = buildtxt([features]);
	selectLayerSource.addFeature(new ol.Feature({
		name: 'thing',
		geometry: features.getGeometry()
	}));


	d = 100 / window.map.getView().getResolution();
	e = ol.extent.getCenter(feature.getGeometry().getExtent())
	np = [e[0], e[1] - d];
	coo = window.map.getCoordinateFromPixel(np);

	window.map.getView().animate({
		center: e, //evt.coordinate,
		duration: 500,
		zoom: 18,
	});

	$('#map_data').hide();
	$('#map_data').css('top', $(window).height() / 2 - 40);
	$('#map_data').css('left', $(window).width() / 2);
	$('#map_data').delay(500).fadeIn();
	$('#map_data .content').html(txt);

	setTimeout(function () {
		window.map.un('pointermove', highlight, {
			hitTolerance: 50
		});
		window.spotLayer.setOpacity(1);
	}, 600);


	window.spotLayer.setOpacity(1)
	$.scrollify.move(p_m)

}

function highlight(evt) {

	selectLayerSource.clear();

	var features = window.map.getFeaturesAtPixel(
		evt.pixel, {
			layerFilter: function (layer) {
				if (layer.get('layer_name') == 'layer') {
					return true
				} else {
					return false
				}
			},
			hitTolerance: 10
		}
	);
	if (features != null) {
		selectLayerSource.addFeature(new ol.Feature({
			name: 'thing',
			geometry: features[0].getGeometry()
		}));
	}
}



function table() {

	columns[0]['events'] = {};
	columns[0]['events']['click .zoom'] = function (e, value, row, index) {
		highlightClick(row.c_carrer_id)
	};
	columns[0]['events']['click .identify'] = function (e, value, row, index) {
		modal(row.c_carrer_id);
	};



	$("#table").bootstrapTable({
		stickyHeader: true,
		cache: false,
		height: $("#table-s").height(),
		undefinedText: "",
		striped: false,
		pagination: false,
		minimumCountColumns: 1,
		//		sortName: config.sortProperty,
		//		sortOrder: config.sortOrder,
		toolbar: "#syncselect",
		search: true,
		trimOnSearch: false,
		showColumns: true,
		showToggle: true,
		columns: columns,
		onClickRow: function (row) {},
		onDblClickRow: function (row) {},
		rowStyle: function (row, index) {
			return rowStyle(row, index)
		},
	});

	tableSync();

	window.map.on('moveend', function () {
		if (syncview) {
			tableSync()
			window.layer.changed();
		}
		$.scrollify.update()
	});
}



function tableSync() {
	where = getFilterSql();

	window.tf = [];

	if (syncview) {
		var extent = window.map.getView().calculateExtent(window.map.getSize());

		window.layer.getSource().forEachFeatureInExtent(extent, function (feature) {
			var e = feature.getProperties();
			delete e['geometry'];
			if (FEATURES.indexOf(feature.values_.c_carrer_id) != -1) {
				tf.push(e)
			}
		});


	} else {

		s = window.layer.getSource().getFeatures();

		$.each(s, function (i, ii) {
			var e = ii.getProperties();
			delete e['geometry'];
			e['actions'] = '<a class="zoom" title="Zoom" style="margin-right: 10px;"><i class="fa fa-search-plus"></i></a><a class="identify" title="Identify"><i class="fa fa-info-circle"></i></a>';
			if (FEATURES.indexOf(ii.values_.c_carrer_id) != -1 && where != '') {
				tf.push(e);
			} else if (where == '') {
				tf.push(e);
			}
		});
	}

	$("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tf)));
	$.scrollify.update();
}


function fexists(url) {
	var result = false
	$('body').append('<img id="imtest" src="' + url + '"/>');
	if ($('#imtest').width != 0) {
		result = true
	}
	$('#imtest').remove()
	return result
}


function carousel() {
	$('#slick div[carrer]').each(function (i, ii) {
		fcarrers['features'].forEach(function (x) {
			if (x['properties']['c_carrer_id'] == $(ii).attr('carrer')) {
				txt = ''
				if (fexists('pic/' + x['properties']['c_carrer_id'] + '.png')) {
					txt += '<img src="pic/' + x['properties']['c_carrer_id'] + '.png">'
				} else {
					txt += '<img src="pic/none.png">'
				}

				txt += '<h4>' + x['properties']['c_denominacio'] + '</h4>'
				txt += '<h3>' + x['properties']['c_nom_carrer_actual'] + '</h3>'
				txt += '<h5>' + x['properties']['c_segle'] + '</h5>'
				txt += '<p>' + x['properties']['c_exp_historica_refos'].slice(0, 150) + '(...)</p>'
				txt += '<div class="button" onclick="highlightClick(\'' + x['properties']['c_carrer_id'] + '\')"><i class="fa fa-info-circle"></i> ves al mapa</div>'


				$(ii).html(txt)
			}
		})

	})
	$('#slick').slick({
		infinite: true,
		slidesToShow: 3,
		slidesToScroll: 3,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 2,
					infinite: true,
					dots: true
				}
    },
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1
				}
    },
			{
				breakpoint: 480,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1
				}
    }]
	});

}


function rowStyle(row, index) {
	var classes = [
      'bg-blue',
      'bg-green',
      'bg-orange',
      'bg-yellow',
      'bg-red'
    ]

	if (index % 2 === 0) {
		return {
			css: {
				background: 'rgba(0, 128, 255, 0.1)'
			}
		}
	}
	return {
		css: {}
	}
}


function formatter(value, row, index, field) {
	var result = value;
	if (field == "c_data_que_va_rebre_la_denominacio") {
		if (value == 0) {
			result = ''
		}
	}
	return result
}

function run() {
	scroll();
	$('#toggle-one').bootstrapToggle({
		size: 'mini',
		on: 'on',
		off: 'off',
		height: 20,
		width: 55
	});

	$('#toggle-one').change(function () {
		if ($(this).prop('checked')) {
			syncview = true;
			window.layer.changed();
			tableSync();
		} else {
			syncview = false;
			window.layer.changed();
			tableSync();
		}
	})

	$.ajax({
		dataType: "json",
		url: carrers,
		success: function (data) {
			$.ajax({
				dataType: "json",
				url: COLS,
				success: function (data2) {
					columns = data2;
					fcarrers = data;
					map();
					carousel();
					$(window).trigger('resize');
				}
			})
		}
	});
}


////////////////////////////////////////////
// Header fixed and Back to top button
$(window).scroll(function () {
	if ($(this).scrollTop() > 100) {
		$('.back-to-top').fadeIn('slow');
	} else {
		$('.back-to-top').fadeOut('slow');
	}
});


$('.back-to-top').click(function () {
	$('html, body').animate({
		scrollTop: 0
	}, 1500, 'easeInOutExpo');
	return false;
});
////////////////////////////////////////////


$(window).on('resize', function () {
	$.scrollify.update()
	$('#home').prev().height($('#home').height())
});

$(document).ready(function () {
	run();
	$(window).trigger('resize');

})
