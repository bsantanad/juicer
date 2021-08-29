"use strict";



function main() {
  /* get canvas from html*/
  var canvas = document.querySelector("#c");
  canvas.width = 400;
  canvas.height = 300;

  var gl = canvas.getContext("webgl");
  if (!gl) {
    console.log("cant run webgl");
    return;
  }

  /* get shader scripts from html */
  var vertexShaderSource = document.querySelector("#vertex-shader-3d").text;
  var fragmentShaderSource = document.querySelector("#fragment-shader-3d").text;

  /* create shaders from script and create program */
  var vertexShader = webgl_utils.createShader(gl,
                                    gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = webgl_utils.createShader(gl,
                                    gl.FRAGMENT_SHADER, fragmentShaderSource);
  var program = webgl_utils.createProgram(gl, vertexShader, fragmentShader);

  /* vertex shader */
  var positionAttrLocation = gl.getAttribLocation(program, "a_position");
  var colorAttrLocation= gl.getAttribLocation(program, "a_color");
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  /* fragment shader */
  var colorLocation = gl.getUniformLocation(program, "u_color");

  /* ARRAY_BUFFER = positionBuffer */
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  /* fill buffer */
  setGeometry(gl);

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);

  /* init scale, rotation, etc.. values */
  var translation = [71, 108, 104];
  var rotation = [m4.deg2rad(0), m4.deg2rad(25), m4.deg2rad(325)];
  var scale = [1, 1, 1];
  var color = [Math.random(), Math.random(), Math.random(), 1];

  drawScene();

  webgl_ui.setupSlider("#move_x",
            {value: translation[0],
             slide: updatePosition(0),
             max: gl.canvas.width });
  webgl_ui.setupSlider("#move_y",
            {value: translation[1],
             slide: updatePosition(1),
             max: gl.canvas.height});
  webgl_ui.setupSlider("#move_z",
            {value: translation[2],
             slide: updatePosition(2),
             max: gl.canvas.height});

  webgl_ui.setupSlider("#angle_x",
            {value: m4.rad2deg(rotation[0]),
             slide: updateRotation(0),
             max: 360});
  webgl_ui.setupSlider("#angle_y",
            {value: m4.rad2deg(rotation[1]),
             slide: updateRotation(1),
             max: 360});
  webgl_ui.setupSlider("#angle_z",
            {value: m4.rad2deg(rotation[2]),
             slide: updateRotation(2),
             max: 360});

  webgl_ui.setupSlider("#scale_x",
            {value: scale[0],
             slide: updateScale(0),
             min: -5, max: 5, step: 0.01, precision: 2});
  webgl_ui.setupSlider("#scale_y",
            {value: scale[1],
             slide: updateScale(1),
             min: -5, max: 5, step: 0.01, precision: 2});
  webgl_ui.setupSlider("#scale_z",
            {value: scale[2],
             slide: updateScale(2),
             min: -5, max: 5, step: 0.01, precision: 2});

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[index] = angleInRadians;
      drawScene();
    };
  }

  function updateScale(index) {
    return function(event, ui) {
      scale[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {

    /* clip space to pixels */
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    /* clear canvas */
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* dont paint triangles facing backwards */
    gl.enable(gl.CULL_FACE);

    /* depth has entered the chat */
    gl.enable(gl.DEPTH_TEST);

    /* tell webgl to use our program (two shaders combined) */
    gl.useProgram(program);

    /* turn on attr */
    gl.enableVertexAttribArray(positionAttrLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


    /* tell the attr how to read data from buffer */
    var size = 3;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(
        positionAttrLocation, size, type, normalize, stride, offset);

    /* turn on attr */
    gl.enableVertexAttribArray(colorAttrLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    /* tell the attr how to read data from buffer */
    var size = 3;
    var type = gl.UNSIGNED_BYTE;
    var normalize = true; // convert 0-255 to 0-1
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(
        colorAttrLocation, size, type, normalize, stride, offset);

    /* enable perspective*/
    // Z will increase as the object is further away, if we divide
    // the matrix by Z, it will look smaller (making it look further away)
    //
    // webgl takes the x, y, z and w value we assign to gl_Position and divides
    // it by w automatically, therefore, we can just copy the Z values to W
    // column and have them divided, giving the effect we are looking for
    var matrix = m4.copyZtoW();
    matrix = m4.multiply(matrix, m4.projection(gl.canvas.clientWidth,
                                               gl.canvas.clientHeight,
                                               400));


    /* tranform the matrix */
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

// Fill the buffer with colors for the 'F'.
function setColors(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
          // left column front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // top rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // middle rung front
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // left column back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // middle rung back
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,
        80, 70, 200,

          // top
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,
        70, 200, 210,

          // top rung right
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,
        200, 200, 70,

          // under top rung
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,
        210, 100, 70,

          // between top rung and middle
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,
        210, 160, 70,

          // top of middle rung
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,
        70, 180, 210,

          // right of middle rung
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,
        100, 70, 210,

          // bottom of middle rung.
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,
        76, 210, 100,

          // right of bottom
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,
        140, 210, 80,

          // bottom
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,
        90, 130, 110,

          // left side
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220,
        160, 160, 220]),
      gl.STATIC_DRAW);
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column front
          0,   0,  0,
          0, 150,  0,
          30,   0,  0,
          0, 150,  0,
          30, 150,  0,
          30,   0,  0,

          // top rung front
          30,   0,  0,
          30,  30,  0,
          100,   0,  0,
          30,  30,  0,
          100,  30,  0,
          100,   0,  0,

          // middle rung front
          30,  60,  0,
          30,  90,  0,
          67,  60,  0,
          30,  90,  0,
          67,  90,  0,
          67,  60,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0]),
      gl.STATIC_DRAW);
}

main();
