"use strict";

var global = this;
var objects = [];
for (let i=0; i<2; i++) {
    var object = {
      uniforms: {
        u_matrix: m4.identity(),
      },
      translation: [-150, 0, -360],
      rotation: [m4.deg2rad(142), m4.deg2rad(25), m4.deg2rad(325)],
      scale: [1, 1, 1],
    };
    global.objects.push(object);
}

function computeMatrix(viewProjectionMatrix, translation, rotation, scale) {
    var matrix = m4.translate(viewProjectionMatrix,
                              translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    return matrix;
}

function main() {
  /* get canvas from html*/
  var canvas = document.querySelector("#c");
  canvas.width = 600;
  canvas.height = 600;

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


  const triangle = createTriangle(gl);
  const triangle2 = createTriangle2(gl);
  var shapes = [
    triangle,
    triangle2,
  ];

  var objectsToDraw = [];
  //var objects = [];

  /* init scale, rotation, etc.. values */
  for (let i=0; i<2; i++) {
    objectsToDraw.push({
      program: program,
      bufferInfo: shapes[i],
      uniforms: global.objects[i].uniforms
    });
  }


  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);

  var fieldOfViewRadians = m4.deg2rad(60);
  var cameraAngleRadians = m4.deg2rad(0);

  drawScene();

  var shapeIndex = document.getElementById('shape').value
  reloadSliders()
  function reloadSliders(){
    webgl_ui.setupSlider("#move_x",
              {value: global.objects[shapeIndex].translation[0],
               slide: updatePosition(0),
               min: -500,
               max: 200 });
    webgl_ui.setupSlider("#move_y",
             {value: global.objects[shapeIndex].translation[1],
              slide: updatePosition(1),
               min: -200,
               max: 200 });
    webgl_ui.setupSlider("#move_z",
              {value: global.objects[shapeIndex].translation[2],
               slide: updatePosition(2),
               min: -1000,
               max: 0 });

    webgl_ui.setupSlider("#angle_x",
              {value: m4.rad2deg(global.objects[shapeIndex].rotation[0]),
               slide: updateRotation(0),
               max: 360});
    webgl_ui.setupSlider("#angle_y",
              {value: m4.rad2deg(global.objects[shapeIndex].rotation[1]),
               slide: updateRotation(1),
               max: 360});
    webgl_ui.setupSlider("#angle_z",
              {value: m4.rad2deg(global.objects[shapeIndex].rotation[2]),
               slide: updateRotation(2),
               max: 360});

    webgl_ui.setupSlider("#scale_x",
              {value: global.objects[shapeIndex].scale[0],
               slide: updateScale(0),
               min: -5, max: 5, step: 0.01, precision: 2});
    webgl_ui.setupSlider("#scale_y",
              {value: global.objects[shapeIndex].scale[1],
               slide: updateScale(1),
               min: -5, max: 5, step: 0.01, precision: 2});
    webgl_ui.setupSlider("#scale_z",
              {value: global.objects[shapeIndex].scale[2],
               slide: updateScale(2),
               min: -5, max: 5, step: 0.01, precision: 2});

  }
  webgl_ui.setupSlider("#camera",
             {value: m4.rad2deg(cameraAngleRadians),
              slide: updateCameraAngle,
              min: -360, max: 360});

  function updateCameraAngle(event, ui) {
    cameraAngleRadians = m4.deg2rad(ui.value);
    drawScene();
  }

  function updatePosition(index) {
    return function(event, ui) {
      global.objects[shapeIndex].translation[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      global.objects[shapeIndex].rotation[index] = angleInRadians;
      drawScene();
    };
  }

  function updateScale(index) {
    return function(event, ui) {
      global.objects[shapeIndex].scale[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
    /* clip space to pixels */
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    /* clear canvas */
    gl.clearColor(0.454, 0.325, 0.6, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* dont paint triangles facing backwards */
    gl.enable(gl.CULL_FACE);

    /* depth has entered the chat */
    gl.enable(gl.DEPTH_TEST);

    /* enable perspective and field of view*/
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    /* camera */
    var radius = 200;
    // Compute a matrix for the camera
    var cameraMatrix = m4.yRotation(cameraAngleRadians);
    cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // compute matrix for each object
    objects.forEach(function(object) {
        object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.rotation,
        object.scale);
    });

    // draw the damn thing
    objectsToDraw.forEach(function(object) {
        gl.useProgram(object.program);
        gl.enableVertexAttribArray(positionAttrLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, object.bufferInfo);

        var size = 3;
        var type = gl.FLOAT;
        var normalize = false;
        var stride = 0;
        var offset = 0;
        gl.vertexAttribPointer(
            positionAttrLocation, size, type, normalize, stride, offset);

        ///// COLOR
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
        ///// COLOR end

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, object.uniforms.u_matrix);

        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 3;
        gl.drawArrays(primitiveType, offset, count);

    });
  }
  return {
    reloadSliders: reloadSliders
  }
}

function createTriangle(gl) {
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          0,   0,  0,
          0, 150,   0,
          30,   0,  0]),
      gl.STATIC_DRAW);
  return positionBuffer;
}

function createTriangle2(gl) {
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          30,   0,  0,
          30,  30,  0,
          100,   0,  0]),
      gl.STATIC_DRAW);
  return positionBuffer;
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
