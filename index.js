import express from "express";
import fs from "fs";
import { dirname } from "path";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser"

const app = express();
const PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const blogMap = {};
let nextBlogIndex = 1;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function preload() {
    fs.readdir("./blogs", (err, files) => {
        files.forEach(file => {
            let fName = file.split(".")[0];
            let fPath = path.join(__dirname, 'blogs', file);
            let index = fName.split("_")[1];
            let title = "";
            fs.readFile(fPath, 'utf-8', (err, data) => {
                let res = JSON.parse(data);
                title = res.title;
                blogMap[fName] = {
                    title: title,
                    path: fPath
                }
            })
            nextBlogIndex = Math.max(nextBlogIndex, parseInt(index)+1);
        })

    })
}

preload();

app.get("/", (req, res) => {
    let blogs = [];
    for (let key in blogMap) {
        let val = blogMap[key];
        blogs.push({
            title: val.title,
            link: "/blogs/" + key
        })
    }
    res.render("index.ejs", {
        bloglist: blogs
    });
})

app.get("/blogs/:blogname", (req, res) => {
    let blogId = req.params.blogname;
    if (blogId in blogMap) {
        let fPath = blogMap[blogId].path;
        fs.readFile(fPath, 'utf-8', (err, rawData) => {
            let data = JSON.parse(rawData);
            res.render("blog.ejs", {
                bid: blogId,
                title: data.title,
                content: data.content
            });
        })
    } else {
        res.redirect();
    }
})

app.get("/blogs/edit/:blogname", (req, res) => {
    let blogId = req.params.blogname;
    let fPath = blogMap[blogId].path;
    fs.readFile(fPath, 'utf-8', (err, rawData) => {
        let data = JSON.parse(rawData);
        res.render("editblog.ejs", {
            bid: blogId,
            title: data.title,
            content: data.content
        });
    })
})

app.post("/blogs/edit/:blogname", (req, res) => {
    let blogId = req.params.blogname;
    let fPath = blogMap[blogId].path;
    let data = JSON.stringify({
        title: req.body.title,
        content: req.body.content
    });
    fs.writeFile(fPath, data , (err) => {
        console.error(err);
    });
    blogMap[blogId].title = req.body.title;
    res.redirect("/");
})

app.get("/blogs/delete/:blogname", (req, res) => {
    let blogId = req.params.blogname;
    let fPath = blogMap[blogId].path;
    fs.unlink(fPath, (err) => {
        console.error(err);
    })
    delete blogMap[blogId];
    res.redirect("/");
})

app.get("/createblog", (req, res) => {
    res.render("createblog.ejs");
})

app.post("/createblog", (req, res) => {
    let fName = "blog_" + nextBlogIndex + ".txt";
    let data = JSON.stringify({
        title: req.body.title,
        content: req.body.content
    });
    let fPath = path.join(__dirname, 'blogs', fName);
    fs.writeFile(fPath, data , (err) => {
        console.error(err);
    });
    blogMap[nextBlogIndex] = {
        title: req.body.title,
        path: fPath
    }
    nextBlogIndex++;
    res.redirect("/");
})

app.listen(PORT, () => {
    console.log(`App started at ${PORT}`);
})