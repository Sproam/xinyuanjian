# 把本地代码上传到 xinyuanjian 仓库

## 一、确认你有权限

- 若仓库负责人要了你「账号名字」，他会把你加为 Collaborator，你才能 push。
- 确认后，用**你们的仓库地址**（在 GitHub 仓库页点绿色 Code 按钮可复制），例如：  
  `https://github.com/用户名/xinyuanjian.git`

---

## 二、在本地关联远程库并上传

在**本项目的根目录**（xinyuanjian-main 文件夹里）打开终端，依次执行：

### 1. 关联远程仓库（只需做一次）

把下面的 `你们的仓库地址` 换成实际地址：

```bash
git remote add origin 你们的仓库地址
```

例如：
```bash
git remote add origin https://github.com/Sproam/xinyuanjian.git
```

### 2. 添加所有修改并提交

```bash
git add .
git commit -m "优化许愿签：长条签、云朵造型、金纹、双色流苏等"
```

### 3. 推送到远程（第一次可能要先拉再推）

如果远程已有内容（比如别人先提交过），先执行：

```bash
git branch -M main
git pull origin main --allow-unrelated-histories
```

如果有冲突，按提示解决后再：

```bash
git add .
git commit -m "合并远程更新"
```

然后推送：

```bash
git push -u origin main
```

如果远程是空仓库，直接：

```bash
git branch -M main
git push -u origin main
```

---

## 三、以后每次改完代码上传

```bash
git add .
git commit -m "简短写一下你做了什么"
git push
```

按对方说的「优化了一些功能之后及时上传并且写一下你做了什么」来做即可。
