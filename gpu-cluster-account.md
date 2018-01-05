将下面的 "IP 主机名" 写入系统的 **hosts文件**
（Linux和MacOS ：/etc/hosts ，
  Windows      : C:\Windows\System32\drivers\etc\hosts ）

210.28.132.167   n167
210.28.132.168   n168
210.28.132.169   n169
210.28.132.170   n170


Mesos Master : http://n167:5050/       查看集群状态，任务状态，以及任务 stdout 和 stderr 打印的输出
Chronos      : http://n167:4400       提交和管理作业，查看作业状态。开启了HTTP Basic登录验证
FTP文件服务   : ftp://n167             管理代码和数据文件
Samba文件服务 : smb://n167:4455/data  管理代码和数据文件

Chronos，FTP和Samba的 **用户名** 均为 `mesos` ，**密码** 均为 `MESOS96ba0602@nju.edu.cn`

JSON配置文件中，"image": "registry.njuics.cn/ying/dlkit:latest"

GPU集群使用说明请见 https://github.com/icsnju/dlkit/blob/master/docs/README.md 
