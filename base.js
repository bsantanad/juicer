"use strict";

function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
            0,   0,  0,
           30,   0,  0,
            0, 150,  0,
            0, 150,  0,
           30,   0,  0,
           30, 150,  0,

          // top rung
           30,   0,  0,
          100,   0,  0,
           30,  30,  0,
           30,  30,  0,
          100,   0,  0,
          100,  30,  0,

          // middle rung
           30,  60,  0,
           67,  60,  0,
           30,  90,  0,
           30,  90,  0,
           67,  60,  0,
           67,  90,  0]),
      gl.STATIC_DRAW);
}

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
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  /* fragment shader */
  var colorLocation = gl.getUniformLocation(program, "u_color");

  /* ARRAY_BUFFER = positionBuffer */
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  /* fill buffer */
  setGeometry(gl);

  /* init scale, rotation, etc.. values */
  var translation = [45, 150, 0];
  var rotation = [m4.deg2rad(40), m4.deg2rad(25), m4.deg2rad(325)];
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
    gl.clear(gl.COLOR_BUFFER_BIT);

    /* tell webgl to use our program (two shaders combined) */
    gl.useProgram(program);

    /* turn on attr */
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    /* tell the attr how to read data from buffer */
    var size = 3;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    gl.uniform4fv(colorLocation, color);

    // Compute the matrices
    var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
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
    var count = 18;  // 6 triangles in the 'F', 3 points per triangle
    gl.drawArrays(primitiveType, offset, count);
  }
}

main();
