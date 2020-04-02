import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  validateForm: FormGroup;

  constructor(private router: Router, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      userName: [null, [Validators.required]],
      password: [null, [Validators.required]],
      remember: [true]
    });
  }
  submitForm(): void {
    const obj = this.validateForm.controls;
    for (const i in obj) {
      if (obj.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }

  }

  login() {
    const userName = this.validateForm.controls.userName.value;
    const password = this.validateForm.controls.password.value;
    console.log(userName + ' ' + password);
    // 验证账号密码
    if (userName === 'admin' && password === '123456') {
      this.router.navigate(['/home']); // 是数组形式
    }
    // 将登陆账号密码写入项目文件
    // const log = bunyan.createLogger({ name: 'myapp' });
    // log.info('hi');
    // const file = new File(['foo'], 'assets/login.txt', {
    //   type: 'text/plain',
    // });
    // const reader = new FileReader();

    // const blob = new Blob(['Hello, world!'], { type: 'text/plain;charset=utf-8' });
    // FileSaver.saveAs(file);
    // document.cookie = 'userName=' + userName;
    // document.cookie = 'password=' + password;
    // document.cookie = 'time=' + new Date();

    // 将页面路由打开home

  }
}
