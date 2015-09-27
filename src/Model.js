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
class Model {
	toString() {
		return this.$$.name;
	}
}

/**
 * Creates a new Model constructor using the given config
 * P
 */
Model.create = function createModel(config) {
	let name = config.name || 'Model';
	let fields = config.fields || [];

	let Constructor = function ModelClass(data) {
		Model.initialize(this, Constructor);
		Model.applyDefaultValues(this, Constructor);
		Model.applyValues(this, Constructor, data);
	};

	let fieldNames = Object.keys(fields);

	// object format: { fieldName: 'self', otherField: String ... }
	fields = fieldNames.map(function(key) {
		return Model.createField(key, fields[key], Constructor);
	});

	let prototype = Object.create(Model.prototype);
	prototype.constructor = Constructor;
	Constructor.prototype = prototype;

	let staticProperties = {
		__fields__: fields,
		__name__: name,
		__model__: true
	};

	Object.keys(staticProperties).forEach(function(key) {
		Object.defineProperty(Constructor, key, {
			value: staticProperties[key],
			writable: false
		});
	});

	let customMethods = config.methods;

	if (customMethods) {
		Object.keys(customMethods).forEach(function(name) {
			if (fieldNames.indexOf(name) !== -1) {
				throw new Error(`Cannot override field ${name} with a custom method of same name`);
			}

			Constructor.prototype[name] = customMethods[name];
		});
	}

	return Constructor;
};

/**
 * Defines a model property based on settings of a Field instance
 * Adds getter/setter to read/write on internal model object
 *
 * @param {Object} model 		Model instance
 * @param {Field} field 		Field instance (usually from Model.__fields__ array)
 */
Model.defineProperty = function defineProperty(model, field) {
	let name = field.name;
	let getter = function() {
		return model.$$.get(name);
	};

	let setter = Model.noop;

	if (!field.readOnly) {
		setter = function setter(value) {
			value = field.parse(value);
			model.$$.set(name, value);
		};
	}

	let descriptor = {
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
 * @param {Function} Constructor 	A Model class constructor (created by Model.create)
 */
Model.initialize = function(model, Constructor) {
	let fields = Constructor.__fields__;

	fields.forEach(function(field) {
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
		get: function() {
			return (model.$$.changed !== false);
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

	let type = typeof config;
	let field = config;

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
Model.applyChanges = function(object, name, value) {
	if (typeof name === 'object' && name) {
		Object.keys(name).forEach((key) => object[key] = name[key]);
	} else {
		object[name] = value;
	}
};

/**
 * Apply default values (defined on model fields) to model instance
 * @param {Object} model 			Model instance
 * @param {Function} Constructor 	Model constructor
 */
Model.applyDefaultValues = function(model, Constructor) {
	Constructor.__fields__.forEach(function(field) {
		if ('default' in field) {
			this.$$.setPersistent(field.name, field.default);
		}
	}, model);
};

Model.applyValues = function(model, Constructor, values) {
	if (!values || typeof values !== 'object') return;

	Constructor.__fields__.forEach(function(field) {
		let name = field.name;

		if (name in values) {
			let value = field.parse(values[name]);
			model.$$.setPersistent(name, value);
		}
	});
};

class ModelMethods {
	setPersistent(name, value) {
		Model.applyChanges(this.data, name, value);
	}

	set(name, value) {
		if (!this.changed) {
			this.changed = {};
		}

		Model.applyChanges(this.changed, name, value);

		return this;
	}

	get(name) {
		return (this.changed && name in this.changed ? this.changed[name] : this.data[name]);
	}

	validate() {
		return {};
	}

	commit() {
		Model.applyChanges(this.data, this.changed);
		this.changed = false;
	}

	rollback() {
		this.changed = false;
	}
}

ModelMethods.create = function(Constructor) {
	var methods = new ModelMethods();

	methods.data = {};
	methods.changed = false;
	methods.fields = Constructor.__fields__;
	methods.name = Constructor.__name__;

	return methods;
};
