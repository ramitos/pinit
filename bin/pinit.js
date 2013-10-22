#!/usr/bin/env node

var handlebars = require('handlebars'),
    interpolate = require('util').format,
    prompt = require('prompt'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    url = require('url'),
    sh = require('sh'),
    fs = require('fs')

var fields = ['name', 'repo', 'author', '(author) website', '(author) mail']

var templates = {}

fs.readdirSync(path.join(__dirname, '../templates')).forEach(function (file) {
  file = path.join(__dirname, '../templates', file)
  templates[file.replace(/\.hbs$/, '')] = handlebars.compile(fs.readFileSync(file, 'utf8'))
})

handlebars.registerHelper('uppercase', function (str) {
  return str.toUpperCase();
})

prompt.start()

prompt.get(fields, function (e, results) {
  if(e) throw e

  results.website = url.parse(results['(author) website'])
  results.mail = results['(author) mail']

  if(!results.website.protocol) results.website = url.format({
    protocol: 'http:',
    slashes: true,
    host: results.website.href
  })

  var cwd = path.join(process.cwd(), results.name)

  mkdirp.sync(cwd)
  process.chdir(cwd)

  sh.cd(cwd).and('git init')
  sh.cd(cwd).and(interpolate('mkdir %s', 'src'))
  sh.cd(cwd).and(interpolate('mkdir %s', 'test'))
  sh.cd(cwd).and(interpolate('touch src/%s.js', results.name))
  sh.cd(cwd).and('touch test/index.js')

  Object.keys(templates).forEach(function (file) {
    var contents = templates[file](results)
    file = path.join(cwd, file.split(/\//).pop())
    fs.writeFileSync(file, contents, 'utf8')
  })
})