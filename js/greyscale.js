function greyscale(context) {
	console.log(0)
	var canvas = context.canvas;
	console.log(0.1)
	var width = canvas.width;
	console.log(0.2)
	var height = canvas.height;
	console.log(0.3)
	context.crossOrigin = "Anonymous";

	console.log(1)

	var imageData = context.getImageData(0, 0, width, height);
	console.log(1.2)
	imageData.setAttribute('crossOrigin', '');
	console.log(2)

	var data = imageData.data;
	for (i = 0; i < data.length; i += 4) {
		var r = data[i];
		var g = data[i + 1];
		var b = data[i + 2];
		// CIE luminance for the RGB
		var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		// Show white color instead of black color while loading new tiles:
		if (v === 0.0)
			v = 255.0;
		data[i + 0] = v; // Red
		data[i + 1] = v; // Green
		data[i + 2] = v; // Blue
		data[i + 3] = 255; // Alpha
	}

	context.putImageData(imageData, 0, 0);

}
