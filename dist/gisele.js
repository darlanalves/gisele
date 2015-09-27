(function(global) {
	'use strict';

	'use strict';

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Field = (function () {
	function Field(config) {
		var _this = this;

		_classCallCheck(this, Field);

		if (!config) {
			throw new Error('Invalid field config');
		}

		Object.keys(config).forEach(function (key) {
			return _this[key] = config[key];
		});
	}

	_createClass(Field, [{
		key: 'parse',
		value: function parse(value) {
			return value;
		}
	}]);

	return Field;
})();

Field.register = new Map();

Field.create = function (config) {
	var type = config.type;
	var FieldConstructor = Field.register.get(type) || CustomField;

	return new FieldConstructor(config);
};

var StringField = (function (_Field) {
	_inherits(StringField, _Field);

	function StringField() {
		_classCallCheck(this, StringField);

		_get(Object.getPrototypeOf(StringField.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(StringField, [{
		key: 'parse',
		value: function parse(value) {
			return String(value !== undefined ? value : '').trim();
		}
	}]);

	return StringField;
})(Field);

var BooleanField = (function (_Field2) {
	_inherits(BooleanField, _Field2);

	function BooleanField() {
		_classCallCheck(this, BooleanField);

		_get(Object.getPrototypeOf(BooleanField.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(BooleanField, [{
		key: 'parse',
		value: function parse(value) {
			return !!value;
		}
	}]);

	return BooleanField;
})(Field);

var NumberField = (function (_Field3) {
	_inherits(NumberField, _Field3);

	function NumberField() {
		_classCallCheck(this, NumberField);

		_get(Object.getPrototypeOf(NumberField.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(NumberField, [{
		key: 'parse',
		value: function parse(value) {
			return value && Number(value) || 0;
		}
	}]);

	return NumberField;
})(Field);

var DateField = (function (_Field4) {
	_inherits(DateField, _Field4);

	function DateField() {
		_classCallCheck(this, DateField);

		_get(Object.getPrototypeOf(DateField.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(DateField, [{
		key: 'parse',
		value: function parse(value) {
			if (isFinite(value)) {
				return new Date(value);
			}

			if (typeof value === 'string') {
				var parsedTime = Date.parse(value);
				if (!isFinite(parsedTime)) return null;

				return new Date(parsedTime);
			}

			return null;
		}
	}]);

	return DateField;
})(Field);

var CustomField = (function (_Field5) {
	_inherits(CustomField, _Field5);

	function CustomField() {
		_classCallCheck(this, CustomField);

		_get(Object.getPrototypeOf(CustomField.prototype), 'constructor', this).apply(this, arguments);
	}

	/**
  * Default constructor/field for primitive values
  */

	_createClass(CustomField, [{
		key: 'parse',
		value: function parse(value) {
			return value !== null ? new this.type(value) : null;
		}
	}]);

	return CustomField;
})(Field);

Field.register.set(String, StringField);
Field.register.set(Number, NumberField);
Field.register.set(Boolean, BooleanField);
Field.register.set(Date, DateField);

/* globals Field */
/**
 * @class Model
 *
 * Model layout:
 *
 * 		model = {
 * 			$$: {}					// model methods (instance of ModelMethods class)
 * 			$$dirty: Boolean		// true if the model has changes to save
 *
 * 			// ... properties and custom methods
 * 		}
 */

var Model = (function () {
	function Model() {
		_classCallCheck(this, Model);
	}

	_createClass(Model, [{
		key: 'toString',
		value: function toString() {
			return this.$$.name;
		}
	}, {
		key: 'toJSON',
		value: function toJSON() {
			return Model.toJSON(this);
		}
	}]);

	return Model;
})();

Model.toJSON = function (model) {
	var sources = [model.$$.data, model.$$.changed || {}];
	var result = {};

	sources.forEach(function (source) {
		Object.keys(source).forEach(function (key) {
			var value = source[key];

			if (Model.isModel(value)) {
				value = value.toJSON();
			}

			if (value instanceof Date) {
				value = value.toJSON();
			}

			result[key] = value;
		});
	});

	return result;
};

Model.isModel = function (value) {
	return value instanceof Model || typeof value === 'function' && value.__model__;
};

/**
 * Creates a new Model constructor using the given config
 * @param {Object} config 		Model configuration
 */
Model.create = function createModel(config) {
	var name = config.name || 'Model';
	var fields = config.fields || [];

	var Constructor = function ModelClass(data) {
		Model.initialize(this, Constructor);
		Model.applyDefaultValues(this, Constructor);
		Model.applyValues(this, Constructor, data);
	};

	var fieldNames = Object.keys(fields);

	// object format: { fieldName: 'self', otherField: String ... }
	fields = fieldNames.map(function (key) {
		return Model.createField(key, fields[key], Constructor);
	});

	var prototype = Object.create(Model.prototype);
	prototype.constructor = Constructor;
	Constructor.prototype = prototype;

	var staticProperties = {
		__fields__: fields,
		__name__: name,
		__model__: true
	};

	Object.keys(staticProperties).forEach(function (key) {
		Object.defineProperty(Constructor, key, {
			value: staticProperties[key],
			writable: false
		});
	});

	var customMethods = config.methods;

	if (customMethods) {
		Object.keys(customMethods).forEach(function (name) {
			if (fieldNames.indexOf(name) !== -1) {
				throw new Error('Cannot override field ' + name + ' with a custom method of same name');
			}

			var method = customMethods[name];

			Constructor.prototype[name] = function () {
				method.apply(this, arguments);
			};
		});
	}

	return Constructor;
};

/**
 * Defines a model property based on settings of a Field instance
 * Adds getter/setter to read/write on internal model object
 *
 * @param {Object} model 		Model instance
 * @param {Field} field 		Field instance
 */
Model.defineProperty = function defineProperty(model, field) {
	var name = field.name;
	var getter = function getter() {
		return model.$$.get(name);
	};

	var setter = Model.noop;

	if (!field.readOnly) {
		setter = function setter(value) {
			value = field.parse(value);
			model.$$.set(name, value);
		};
	}

	var descriptor = {
		enumerable: true,
		get: getter,
		set: setter
	};

	Object.defineProperty(model, name, descriptor);
};

/**
 * Initialize a model instance
 *
 * @param {Object} model 			Model instance
 * @param {Function} Constructor 	Constructor of instance (a Function created with Model.create)
 */
Model.initialize = function (model, Constructor) {
	var fields = Constructor.__fields__;

	fields.forEach(function (field) {
		Model.defineProperty(model, field);
	});

	var modelInternals = ModelMethods.create(Constructor);

	// Model methods
	Object.defineProperty(model, '$$', {
		enumerable: false,
		value: modelInternals
	});

	// Virtual property. Returns true if the model has any changes
	Object.defineProperty(model, '$$dirty', {
		enumerable: false,
		set: Model.noop,
		get: function get() {
			return model.$$.changed !== false;
		}
	});
};

Model.noop = function noop() {};

/**
 * Create and return a model field instance
 * @param {String} name 			Field name
 * @param {Object} config 			Field config
 * @param {Function} Constructor 	The model constructor which will use this field
 */
Model.createField = function createField(name, config, Constructor) {
	if (!config) {
		throw new Error('Invalid field config', config);
	}

	// replace the 'self' reference with the actual model Constructor
	if (config === 'self') {
		config = Constructor;
	} else if (config.type === 'self') {
		config.type = Constructor;
	}

	var type = typeof config;
	var field = config;

	// field is a constructor
	if (type === 'function') {
		field = {
			type: field
		};
	}

	if (!field.name) {
		field.name = name;
	}

	if (typeof field.type !== 'function') {
		throw new Error('Invalid field type', field.type);
	}

	return Field.create(field);
};

/**
 * Apply a change to an object or a set of changes
 * @param {Object} object 		The target object
 * @param {String|Object}		Property name, or an object with changes
 * @param {*} value 			The value to apply (if name is a property)
 */
Model.applyChanges = function (object, name, value) {
	if (typeof name === 'object' && name) {
		Object.keys(name).forEach(function (key) {
			return object[key] = name[key];
		});
	} else {
		object[name] = value;
	}
};

/**
 * Apply default values (defined on model fields) to model instance
 * @param {Object} model 			Model instance
 * @param {Function} Constructor 	Constructor of model instance
 */
Model.applyDefaultValues = function (model, Constructor) {
	Constructor.__fields__.forEach(function (field) {
		if ('default' in field) {
			this.$$.setPersistent(field.name, field['default']);
		}
	}, model);
};

/**
 * Apply a set of values to a model instance
 * @param {Object} model 			Model instance
 * @param {Function} Constructor 	Constructor of model instance
 */
Model.applyValues = function (model, Constructor, values) {
	if (!values || typeof values !== 'object') return;

	Constructor.__fields__.forEach(function (field) {
		var name = field.name;

		if (name in values) {
			var value = field.parse(values[name]);
			model.$$.setPersistent(name, value);
		}
	});
};

var ModelMethods = (function () {
	function ModelMethods() {
		_classCallCheck(this, ModelMethods);
	}

	/**
  * Creates an instance of ModelMethods bound to Constructor
  * to use as a base object for a model instance
  */

	_createClass(ModelMethods, [{
		key: 'setPersistent',
		value: function setPersistent(name, value) {
			Model.applyChanges(this.data, name, value);
		}
	}, {
		key: 'set',
		value: function set(name, value) {
			if (!this.changed) {
				this.changed = {};
			}

			Model.applyChanges(this.changed, name, value);

			return this;
		}
	}, {
		key: 'get',
		value: function get(name) {
			return this.changed && name in this.changed ? this.changed[name] : this.data[name];
		}
	}, {
		key: 'commit',
		value: function commit() {
			Model.applyChanges(this.data, this.changed);
			this.changed = false;
		}
	}, {
		key: 'rollback',
		value: function rollback() {
			this.changed = false;
		}
	}]);

	return ModelMethods;
})();

ModelMethods.create = function (Constructor) {
	var methods = new ModelMethods();

	methods.data = {};
	methods.changed = false;
	methods.fields = Constructor.__fields__;
	methods.name = Constructor.__name__;

	return methods;
};

/**
 * Model.fn
 * Methods available on each model instance
 */
Model.fn = ModelMethods.prototype;

	var Gisele = {
		Model: Model,
		Field: Field
	};

	if (typeof define === 'function' && define.amd) {
		define(function() {
			return Gisele;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = Gisele;
	} else {
		global.Gisele = Gisele;
	}

})(this);