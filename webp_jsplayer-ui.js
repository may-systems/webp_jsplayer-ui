/* webp_jsplayer-ui.js – WebP twin of https://github.com/LCweb-ita/LC-GIF-Player/blob/master/lc_gif_player.js
 * Generates the same .lcgp_* controls, so your existing CSS works untouched.
 * Needs webp_jsplayer.js (SuperWebP) loaded first.
 */
(function () {
	'use strict';

	var webp_jsplayer_count      = 0;   // progressive index
	var webp_jsplayer_instances  = [];  // SuperWebP objects
	var webp_jsplayer_cont_move  = [];  // interval IDs for continuous next/prev

	/* MAIN */
	window.webp_jsplayer_ui = function (selector, autoplay, addit_class, to_hide) {
		if (typeof to_hide === 'undefined') to_hide = [];

		document.querySelectorAll(selector).forEach(function (wrap) {
			var img = wrap.querySelector('img');
			if (!img) return;

			var src = img.getAttribute('rel:animated_src') || img.src;
			var id  = webp_jsplayer_count++;

			wrap.setAttribute('data-lcgp-inst', id);
			wrap.setAttribute('data-lcgp-src',  src);
			wrap.classList.add('lcgp_wrap', 'lcgp_initialstate', 'lcgp_' + id);
			if (addit_class) wrap.classList.add(addit_class);

			/* SuperWebP instance */
			webp_jsplayer_instances[id] = new SuperWebP({ webp: img, auto_play: !!autoplay });
			webp_jsplayer_instances[id].load(function () {
				build_controls(wrap, id, to_hide);
				wrap.classList.add('lcgp_loaded');	// ← ensures .lcgp_loaded CSS fires
				if (!webp_jsplayer_instances[id].supported) {
					wrap.classList.add('webp-jsplayer-fallback');
				}
			});
		});
	};


	/* ----------  CONTROLS  ---------- */
	function build_controls (wrap, id, to_hide) {
		var cmd = document.createElement('div');
		cmd.className = 'lcpg_cmd';

		cmd.innerHTML =
			  '<span class="lcgp_play"  title="play"></span>'
			+ '<span class="lcgp_pause" title="pause"></span>'
			+ '<span class="lcgp_stop"  title="back to beginning"></span>';

		if (to_hide.indexOf('move') === -1) {
			cmd.innerHTML +=
				  '<span class="lcgp_prev" title="hold to move backward"></span>'
				+ '<span class="lcgp_next" title="hold to move forward"></span>';
		}
		if (to_hide.indexOf('fullscreen') === -1) {
			cmd.innerHTML +=
				  '<span class="lcgp_enter_fs" title="enter fullscreen"></span>'
				+ '<span class="lcgp_exit_fs"  title="exit fullscreen"></span>';
		}

		wrap.appendChild(cmd);
		bind_actions(wrap, id);
	}


	/* ----------  ACTIONS  ---------- */
	function bind_actions (wrap, id) {
		var player = webp_jsplayer_instances[id];

		/* click on canvas toggles play / pause */
		wrap.addEventListener('click', function (e) {
			if (wrap.classList.contains('lcgp_initialstate')) {
				wrap.querySelector('.lcgp_play').click();
			} else if (e.target.tagName === 'CANVAS') {
				(wrap.classList.contains('lcgp_paused')
					? wrap.querySelector('.lcgp_play')
					: wrap.querySelector('.lcgp_pause')).click();
			}
		});

		/* play */
		wrap.querySelector('.lcgp_play').addEventListener('click', function () {
			player.play();
			wrap.classList.remove('lcgp_paused', 'lcgp_initialstate');
			wrap.classList.add('lcgp_playing');
		});

		/* pause */
		wrap.querySelector('.lcgp_pause').addEventListener('click', function () {
			player.pause();
			wrap.classList.add('lcgp_paused');
			wrap.classList.remove('lcgp_playing');
		});

		/* stop (back to first frame) */
		wrap.querySelector('.lcgp_stop').addEventListener('click', function () {
			player.pause();
			player.move_to(0);
			wrap.classList.add('lcgp_initialstate');
			wrap.classList.remove('lcgp_playing', 'lcgp_paused');
		});

		/* prev / next – continuous while mouse held */
		var prev = wrap.querySelector('.lcgp_prev');
		var next = wrap.querySelector('.lcgp_next');

		if (prev) {
			prev.addEventListener('mousedown', function () {
				player.pause();
				continuous('prev', id);
			});
			prev.addEventListener('mouseup', function () { clearInterval(webp_jsplayer_cont_move[id]); });
		}

		if (next) {
			next.addEventListener('mousedown', function () {
				player.pause();
				continuous('next', id);
			});
			next.addEventListener('mouseup', function () { clearInterval(webp_jsplayer_cont_move[id]); });
		}

		/* fullscreen in */
		var enter = wrap.querySelector('.lcgp_enter_fs');
		if (enter) {
			enter.addEventListener('click', function () {
				wrap.querySelector('.lcgp_pause').click();
				enter_fullscreen(wrap, id);
			});
		}

		/* fullscreen out */
		var exit = wrap.querySelector('.lcgp_exit_fs');
		if (exit) {
			exit.addEventListener('click', function () {
				var fs = document.getElementById('lcgp_fs_wrap');
				if (fs) fs.remove();
			});
		}
	}

	/* continuous prev/next helper */
	function continuous (dir, id) {
		clearInterval(webp_jsplayer_cont_move[id]);
		step(dir, id);                                     // immediate
		webp_jsplayer_cont_move[id] = setInterval(function () {     // repeating
			step(dir, id);
		}, 100);
	}
	function step (dir, id) {
		webp_jsplayer_instances[id].move_relative(dir === 'next' ? 1 : -1);
	}

	/* ----------  FULLSCREEN  ---------- */
	function enter_fullscreen (origin, id) {
		var src = origin.getAttribute('data-lcgp-src');

		var fs = document.createElement('div');
		fs.id = 'lcgp_fs_wrap';
		fs.innerHTML = '<div><img src="" rel:animated_src="' + src + '"></div>';
		document.body.appendChild(fs);

		webp_jsplayer_ui('#lcgp_fs_wrap div', true, origin.className, ['fullscreen']);

		/* click background to exit */
		fs.addEventListener('click', function (e) {
			if (e.target.id === 'lcgp_fs_wrap') fs.remove();
		});
	}

	/* ESC key closes fullscreen */
	document.addEventListener('keydown', function (e) {
		if ((e.key === 'Escape' || e.key === 'Esc') && document.getElementById('lcgp_fs_wrap')) {
			document.getElementById('lcgp_fs_wrap').remove();
		}
	});
}());
