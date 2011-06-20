if (typeof(protobuf)=="undefined") {protobuf = {};}

protobuf.ui = PROTO.Message("protobuf.ui",{
	thresh: {
    options: {widget: 'slider', min: 0, max: 255},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.Double;},
		id: 1
	},
	decay_mode: {
    options: {widget: 'radio', choices: ['Linear', 'Exponential']},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.uint32;},
		id: 2
	},
	decay_halflife: {
    options: {widget: 'slider', min: 0.001, max: 2.0},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.Double;},
		id: 3
	},
	decay_offset: {
    options: {widget: 'slider', min: 0, max: 255},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.Double;},
		id: 4
	},
	fullscreen: {
    options: {widget: 'toggle'},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.bool;},
		id: 5
	},
	blur_amt: {
    options: {widget: 'slider', min: 0.0, max: 20.0},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.Float;},
		id: 6
	},
	fft_bins: {
    options: {widget: 'slider', min: 1, max: 1024},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.uint32;},
		id: 7
	},
	n_bands: {
    options: {widget: 'slider', min: 1, max: 16},
		multiplicity: PROTO.optional,
		type: function(){return PROTO.uint32;},
		id: 8
	}});
