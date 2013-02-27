
function TmpFile() {
  TmpFile.tmproot = "." + sep + "tests" + sep + "tmp";
}
function dirExistsSync(d) {
  try { fs.statSync(d); return true }
  catch (er) { return false }
}

TmpFile.prototype.tmpdir = function (basename) {
  if (dirExistsSync(TmpFile.tmproot)) {
  } else {
    fs.mkdirSync(TmpFile.tmproot);
  }
  ++g.tmpcounter;
  var name = TmpFile.tmproot + sep + basename + "_" + process.pid + "_" + (g.tmpcounter);
  if (dirExistsSync(name)) {
  } else {
    fs.mkdirSync(name);
  }
  return name;
};
TmpFile.prototype.tmpfile = function (dir, basename) {
  var name = dir + sep + basename + "_" + process.pid + "_" + (g.tmpcounter);
  return name;
};
module.exports = TmpFile;