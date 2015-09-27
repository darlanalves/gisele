class Field {
	constructor(config) {
		if (!config) {
			throw new Error('Invalid field config');
		}

		Object.keys(config).forEach((key) => this[key] = config[key]);
	}

	parse(value) {
		return value;
	}
}

Field.register = new Map();

Field.create = function(config) {
	let type = config.type;
	let FieldConstructor = Field.register.get(type) || CustomField;

	return new FieldConstructor(config);
};

class StringField extends Field {
	parse(value) {
		return String(value !== undefined ? value : '').trim();
	}
}

class BooleanField extends Field {
	parse(value) {
		return !!value;
	}
}

class NumberField extends Field {
	parse(value) {
		return value && Number(value) || 0;
	}
}

class DateField extends Field {
	parse(value) {
		if (isFinite(value)) {
			return new Date(value);
		}

		if (typeof value === 'string') {
			let parsedTime = Date.parse(value);
			if (!isFinite(parsedTime)) return null;

			return new Date(parsedTime);
		}

		return null;
	}
}

class CustomField extends Field {
	parse(value) {
		return value !== null ? new this.type(value) : null;
	}
}

/**
 * Default constructor/field for primitive values
 */
Field.register.set(String, StringField);
Field.register.set(Number, NumberField);
Field.register.set(Boolean, BooleanField);
Field.register.set(Date, DateField);
