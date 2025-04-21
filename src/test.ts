const getClass = () => {
	return class {
		static z() {}

		constructor() {
			console.log('hello');
		}
	};
};

class Constructor extends getClass() {}

type CanType<T> = T;

let a: CanType<Constructor>;
