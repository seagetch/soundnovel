/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./ui/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./ui/index.ts":
/*!*********************!*\
  !*** ./ui/index.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var ipcRenderer = __webpack_require__(/*! electron */ \"electron\").ipcRenderer;\nvar command_name = \"\";\nvar audio;\nvar initialized = false;\nfunction image_renderer(canvas, image) {\n    var ctx = canvas.getContext('2d');\n    return function (ev) {\n        var dest_rate = canvas.width / canvas.height;\n        var src_rate = image.width / image.height;\n        if (src_rate > dest_rate) {\n            var y = image.height * canvas.width / image.width;\n            ctx.fillStyle = \"rgb(0, 0, 0)\";\n            ctx.fillRect(0, 0, canvas.width, (canvas.height - y) / 2);\n            ctx.fillRect(0, (canvas.height + y) / 2, canvas.width, (canvas.height - y) / 2);\n            ctx.drawImage(image, 0, 0, image.width, image.height, 0, (canvas.height - y) / 2, canvas.width, y);\n        }\n        else {\n            var x = image.width * canvas.height / image.height;\n            ctx.fillStyle = \"rgb(0, 0, 0)\";\n            ctx.fillRect(0, 0, (canvas.width - x) / 2, canvas.height);\n            ctx.fillRect((canvas.width + x) / 2, 0, (canvas.width - x) / 2, canvas.height);\n            ctx.drawImage(image, 0, 0, image.width, image.height, (canvas.width - x) / 2, 0, x, canvas.height);\n        }\n    };\n}\nfunction scene(command) {\n    var image_src = command[2];\n    var canvas = document.getElementById('canvas');\n    if (Array.isArray(image_src)) {\n        var off_canvas_1 = $(\"<canvas>\").get()[0];\n        var off_ctx_1 = off_canvas_1.getContext('2d');\n        switch (image_src[0]) {\n            case \"truncate\":\n                {\n                    var i_1 = new Image();\n                    var bounds_1 = image_src[2];\n                    i_1.onload = function (ev) {\n                        off_canvas_1.width = i_1.width * bounds_1[1][0];\n                        off_canvas_1.height = i_1.height * bounds_1[1][1];\n                        off_ctx_1.drawImage(i_1, i_1.width * bounds_1[0][0], i_1.height * bounds_1[0][1], off_canvas_1.width, off_canvas_1.height, 0, 0, off_canvas_1.width, off_canvas_1.height);\n                        image_renderer(canvas, off_canvas_1)();\n                    };\n                    i_1.src = image_src[1];\n                }\n                break;\n            case \"horizontal\":\n            case \"vertical\":\n                {\n                    Promise.all(image_src.slice(1, image_src.length).map(function (elem) {\n                        var i = new Image();\n                        return new Promise(function (resolve, reject) {\n                            i.onload = function (ev) {\n                                resolve(i);\n                            };\n                            i.src = elem;\n                        });\n                    })).then(function (images) {\n                        var red_w;\n                        var red_h;\n                        var ofs_x = 0, ofs_y = 0;\n                        if (image_src[0] == \"horizontal\") {\n                            red_w = function (x, y, _1, _2) { return x + y; };\n                            red_h = function (x, y, _1, _2) { return (x > y) ? x : y; };\n                            ofs_x = 1;\n                        }\n                        else {\n                            red_h = function (x, y, _1, _2) { return x + y; };\n                            red_w = function (x, y, _1, _2) { return (x > y) ? x : y; };\n                            ofs_y = 1;\n                        }\n                        var w = images.map(function (i) { return i.width; }).reduce(red_w);\n                        var h = images.map(function (i) { return i.height; }).reduce(red_h);\n                        off_canvas_1.width = w;\n                        off_canvas_1.height = h;\n                        var x = 0, y = 0;\n                        for (var _i = 0, images_1 = images; _i < images_1.length; _i++) {\n                            var i = images_1[_i];\n                            off_ctx_1.drawImage(i, x, y);\n                            x += ofs_x * i.width;\n                            y += ofs_y * i.height;\n                        }\n                        image_renderer(canvas, off_canvas_1)();\n                    });\n                }\n                break;\n            default:\n                console.log(\"Unknown command: \" + image_src[0]);\n        }\n    }\n    else if (typeof image_src == \"string\") {\n        var image = new Image();\n        image.onload = image_renderer(canvas, image);\n        image.src = image_src;\n    }\n    else {\n        alert(\"Unknows image src=\" + image_src);\n    }\n    if (command[1]) {\n        audio = new Audio(command[1]);\n        var audio_rewind = function () { audio.currentTime = 0; };\n        var audio_rewind10 = function () { audio.currentTime -= 10; };\n        var audio_forward10 = function () { audio.currentTime += 10; };\n        var audio_forward = function () {\n            audio.pause();\n            ipcRenderer.send(\"command\", command_name);\n            audio = null;\n        };\n        var audio_mute = function () { audio.muted = true; };\n        var audio_unmute = function () { audio.muted = false; };\n        var scenario_terminate = function () {\n            audio.pause();\n            ipcRenderer.send(\"terminate\", command_name);\n            audio = null;\n        };\n        var sound_operations_1 = [\n            { \"Previous\": [\"⏮\", \"Previous\", audio_rewind] },\n            { \"Backward\": [\"⏪\", \"Backward\", audio_rewind10] },\n            { \"Pause\": [\"⏸\", \"Play\", function () { audio.pause(); }], \"Play\": [\"⏵\", \"Pause\", function () { audio.play(); }] },\n            { \"Forward\": [\"⏩\", \"Forward\", audio_forward10] },\n            { \"Next\": [\"⏭\", \"Next\", audio_forward] },\n            { \"Mute\": [\"🔈\", \"Unmute\", audio_mute], \"Unmute\": [\"🔇\", \"Mute\", audio_unmute] },\n            { \"Cancel\": [\"⏹\", \"Cancel\", scenario_terminate] }\n        ];\n        var operation_states_1 = [\n            \"Previous\", \"Backward\", \"Pause\", \"Forward\", \"Next\", \"Mute\", \"Cancel\"\n        ];\n        var update_progress = function () {\n            if (audio) {\n                var rate = audio.currentTime / audio.duration;\n                var canvas_1 = document.getElementById('sound-progress');\n                var w = canvas_1.width, h = canvas_1.height;\n                var ctx = canvas_1.getContext('2d');\n                ctx.fillStyle = \"white\";\n                ctx.fillRect(0, 0, w * rate, 32);\n                ctx.fillStyle = \"rgb(96, 96, 96)\";\n                ctx.fillRect(w * rate, 0, w - w * rate, 32);\n            }\n        };\n        audio.ontimeupdate = update_progress;\n        var scanvas_1 = document.getElementById('sound-progress');\n        $(scanvas_1).off(\"mousedown\").on(\"mousedown\", function (ev) {\n            var mev = ev;\n            if (audio && audio.duration > 0) {\n                var rate = mev.offsetX / scanvas_1.width;\n                audio.currentTime = rate * audio.duration;\n            }\n        });\n        audio.onended = function (event) {\n            ipcRenderer.send(\"command\", command_name);\n            audio = null;\n        };\n        var sound_op_area = $(\"#sound-ops\").html(\"\");\n        var _loop_1 = function (i) {\n            var cmd = sound_operations_1[i];\n            $(\"<span>\").html(cmd[operation_states_1[i]][0]).css({\n                \"margin-left\": (i == 0) ? \"28px\" : \"8\",\n                \"margin-top\": \"8\",\n                \"margin-bottom\": \"8\",\n                \"display\": \"inline-block\",\n                \"font-size\": \"32px\",\n                \"width\": \"48px\",\n                \"height\": \"48px\",\n                \"text-align\": \"center\",\n                \"border-radius\": \"50%\",\n            }).hover(function (ev) {\n                $(ev.target).css({ \"color\": \"inherit\", \"background-color\": \"#808080\" });\n            }, function (ev) {\n                $(ev.target).css({ \"color\": \"inherit\", \"background-color\": \"transparent\" });\n            }).on(\"mousedown\", function (ev) {\n                $(ev.target).css({ \"color\": \"black\", \"background-color\": \"white\" });\n            }).on(\"click\", function (ev) {\n                $(ev.target).css({ \"color\": \"inherit\", \"background-color\": \"transparent\" });\n                var states = operation_states_1[i];\n                cmd[states][2]();\n                operation_states_1[i] = cmd[states][1];\n                $(ev.target).html(sound_operations_1[i][cmd[states][1]][0]);\n            }).appendTo(sound_op_area);\n        };\n        for (var i = 0; i < operation_states_1.length; i++) {\n            _loop_1(i);\n        }\n        var sound_1 = $(\"#sound\");\n        scanvas_1.width = (sound_1.innerWidth() - sound_op_area.outerWidth()) * 0.95;\n        scanvas_1.style.width = scanvas_1.width + \"px\";\n        sound_1.off(\"mouseenter\");\n        sound_1.off(\"mouseleave\");\n        sound_1.hover(function (ev) {\n            sound_1.fadeTo(250, 0.5);\n        }, function (ev) {\n            sound_1.fadeTo(250, 0.0);\n        });\n        audio.play();\n    }\n    else {\n        audio = null;\n        ipcRenderer.send(\"command\", command_name);\n    }\n}\nfunction ask(command) {\n    var options = command[1];\n    var location = options[\"location\"];\n    var x = location ? location[0] : 0, y = location ? location[1] : 0;\n    var fontsize = options[\"size\"] ? options[\"size\"] : 40;\n    var layout = options[\"layout\"];\n    var direction = layout ? layout[\"direction\"] : \"vertical\";\n    var ofs_x = layout ? layout[\"offset\"][0] : 0, ofs_y = layout ? layout[\"offset\"][1] : 100;\n    var line_size = layout ? layout[\"line-size\"] : null;\n    var color_info = options[\"color\"];\n    var color = color_info ? color_info[\"base\"] : \"rgb(240, 240, 240)\";\n    var hcolor = color_info ? color_info[\"hover\"] : \"rgb(240, 224, 0)\";\n    var scolor = color_info ? color_info[\"selected\"] : \"rgb(240, 0, 0)\";\n    var candidates = command[1][\"candidates\"];\n    var selection = $(\"#selection\").html(\"\").css({\n        \"position\": \"absolute\",\n        \"top\": y + \"px\",\n        \"left\": x + \"px\",\n        \"z-index\": \"100\",\n        \"display\": \"block\",\n        \"border-color\": \"#000000\",\n        \"width\": (direction == \"horizontal\" && line_size) ? (ofs_x * line_size) + \"px\" : \"auto\",\n        \"height\": (direction == \"vertical\" && line_size) ? (ofs_y * line_size) + \"px\" : \"auto\"\n    });\n    var _loop_2 = function (c) {\n        $(\"<div>\").html(c).css({\n            \"font-size\": fontsize.toString() + \"px\",\n            \"font-weight\": \"700\",\n            \"flex-direction\": (direction == \"vertical\") ? \"column\" : \"row\",\n            \"color\": color,\n            \"display\": (direction == \"vertical\") ? \"block\" : \"inline-block\",\n            \"padding\": \"0\",\n            \"margin\": \"0\",\n            \"height\": ofs_y,\n            \"width\": (direction == \"vertical\") ? \"auto\" : ofs_x + \"px\",\n            \"z-index\": fontsize.toString() + \"px\"\n        }).hover(function (ev) {\n            $(ev.target).css({ \"color\": hcolor });\n        }, function (ev) {\n            $(ev.target).css({ \"color\": color });\n        }).mousedown(function (ev) {\n            $(ev.target).css({ \"color\": scolor });\n        }).click(function (ev) {\n            selection.css({ \"display\": \"none\" });\n            ipcRenderer.send(\"set-variable\", options[\"variable\"], c);\n            ipcRenderer.send(\"command\", command_name);\n        }).appendTo(selection);\n    };\n    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {\n        var c = candidates_1[_i];\n        _loop_2(c);\n    }\n}\nipcRenderer.on(\"command\", function (event, command) {\n    if (!initialized) {\n        initialized = true;\n        var w = window.innerWidth, h = window.innerHeight;\n        $(\"#background\").css({\n            \"padding\": \"0\",\n            \"margin\": \"0\",\n            \"position\": \"absolute\",\n            \"top\": \"0\",\n            \"left\": \"0\",\n            \"z-index\": \"-1\"\n        });\n        var canvas = document.getElementById(\"canvas\");\n        canvas.width = w;\n        canvas.height = h;\n        $(\"#sound-progress\").css({\n            \"height\": \"24px\",\n            \"width\": \"available\",\n            \"padding\": \"0\",\n            \"margin\": \"0\",\n            \"vertical-align\": \"middle\",\n            \"flex-direction\": \"row\"\n        });\n        var scanvas = document.getElementById(\"sound-progress\");\n    }\n    command_name = command[0];\n    if (command[0] == \"scene\") {\n        scene(command);\n    }\n    else if (command[0] == \"ask\") {\n        ask(command);\n    }\n    else if (command[0] == \"title\") {\n        document.title = command[1];\n        ipcRenderer.send(\"command\", command_name);\n    }\n    else {\n        ipcRenderer.send(\"command-error\", command_name);\n    }\n});\nwindow.onkeydown = function (event) {\n    if (event.key == 'Enter' && audio) {\n        audio.pause();\n        ipcRenderer.send(\"command\", command_name);\n        audio = null;\n    }\n};\nipcRenderer.send(\"command\", command_name);\n\n\n//# sourceURL=webpack:///./ui/index.ts?");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"electron\");\n\n//# sourceURL=webpack:///external_%22electron%22?");

/***/ })

/******/ });