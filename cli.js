#!/usr/bin/env node

'use strict';

const dns = require('dns');
const https = require('https');
const fs = require('fs');
const os = require('os');
const fse = require('fs-extra');
const got = require('got');
const isUrl = require('is-url');
const chalk = require('chalk');
const logUpdate = require('log-update');
const ora = require('ora');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({ pkg }).notify();

const arg = process.argv[2];
const inf = process.argv[3];
const pre = chalk.cyan.bold('›');
const pos = chalk.red.bold('›');
const dir = `${os.homedir()}/facebook-videos/`;
const spinner = ora();

if (!arg || arg === '--help') {
	console.log(`
 Cú pháp: fbdl <command> [source]

 Command:
  -l, --low     Download video ở chất lượng thấp
  -h, --high    Download video ở chất lượng cao HD

 Ví dụ:
  $ fbdl -l https://www.facebook.com/9gag/videos/10155721204506840/
 `);
	process.exit(1);
}

if (!inf || isUrl(inf) === false) {
	logUpdate(`\n${pos} url không đúng định dạng \n`);
	process.exit(1);
}

fse.ensureDir(dir, err => {
	if (err) {
		process.exit(1);
	}
});

const checkConnection = () => {
	dns.lookup('facebook.com', err => {
		if (err) {
			logUpdate(`\n${pos} Không thể kết nối với máy chủ Facebook!\n`);
			process.exit(1);
		} else {
			logUpdate();
			spinner.text = 'Check kết nối thành công! quẩy thôi!';
			spinner.start();
		}
	});
};

const downloadMessage = () => {
	logUpdate();
	spinner.text = 'Đang download video! Vui lòng không ngắt tiến trình (Ctrl+C)';
};

const showError = () => {
	logUpdate(
		`\n${pos}${pos} Có thể video đang bị : \n\n ${pre} Bị xóa \n ${pre} Không ở chế độ public \n\n ${chalk.dim(
			'cho -h or --high : Video không có tùy chọn phân giải HD!\n'
		)}`
	);
	process.exit(1);
};

const download = sources => {
	const rand = Math.random()
		.toString(16)
		.substr(10);
	const save = fs.createWriteStream(`${dir}/${rand}.mp4`);

	https.get(sources, (res, cb) => {
		res.pipe(save);

		save.on('finish', () => {
			save.close(cb);
			logUpdate(
				`\n${pre} Video đã được lưu! Vị trí video ${chalk.dim(
					`${dir}/[${rand}.mp4]`
				)}\n`
			);
			spinner.stop();

			save.on('error', () => {
				process.exit(1);
			});
		});
	});
};

if (arg === '-l' || arg === '--low') {
	checkConnection();
	got(inf)
		.then(res => {
			downloadMessage();
			const data = res.body.split('sd_src:"')[1].split('",hd_tag')[0];
			download(data);
		})
		.catch(error => {
			if (error) {
				showError();
			}
		});
}

if (arg === '-h' || arg === '--high') {
	checkConnection();
	got(inf)
		.then(res => {
			downloadMessage();
			const data = res.body.split('hd_src:"')[1].split('",sd_src:"')[0];
			download(data);
		})
		.catch(error => {
			if (error) {
				showError();
			}
		});
}
