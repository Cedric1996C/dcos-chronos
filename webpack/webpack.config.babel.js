import autoprefixer from "autoprefixer";
import colorLighten from "less-color-lighten";
import fs from "fs";
import less from "less";
import path from "path";
import postcss from "postcss";
import purifycss from "purify-css";
import React from "react";
import ReactDOMServer from "react-dom/server";
// import StringReplacePlugin from "string-replace-webpack-plugin";

import ExtractTextPlugin from "extract-text-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import StringReplacePlugin from "string-replace-webpack-plugin";
import WebpackNotifierPlugin from "webpack-notifier";
import webpack from "webpack";
import SVGCompilerPlugin from "./plugins/svg-compiler-plugin";
import IconDCOSLogoMark from "../src/js/components/icons/IconDCOSLogoMark.js";

function absPath() {
  const args = [].slice.apply(arguments);
  args.unshift(__dirname, "..");

  return path.resolve.apply(path.resolve, args);
}

// Can override this with npm config set externalplugins ../some/relative/path/to/repo
const externalPluginsDir = absPath(
  process.env.npm_config_externalplugins || "plugins"
);

new Promise(function(resolve, reject) {
  const cssEntryPoint = path.join(__dirname, "../src/styles/index.less");
  less.render(
    fs.readFileSync(cssEntryPoint).toString(),
    {
      filename: cssEntryPoint,
      plugins: [colorLighten]
    },
    function(error, output) {
      if (error) {
        console.log(error);
        process.exit(1);
      }

      const prefixer = postcss([autoprefixer]);
      prefixer
        .process(output.css)
        .then(function(prefixed) {
          resolve(prefixed.css);
        })
        .catch(reject);
    }
  );
}).then(function(css) {
  bootstrap.CSS = css;
});

function requireFromString(src, filename) {
  const Module = module.constructor;
  const sourceModule = new Module();
  sourceModule._compile(src, filename);

  return sourceModule.exports;
}

const bootstrap = {
  CSS: "",
  HTML: ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconDCOSLogoMark)
  )
};

module.exports = {
  module: {
    loaders: [
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /<!--\[if\sBOOTSTRAP-HTML\]><!\[endif\]-->/g,
              replacement() {
                return (
                  '<div class="application-loading-indicator ' +
                  'vertical-center">' +
                  bootstrap.HTML +
                  "</div>"
                );
              }
            }
          ]
        }),
        enforce: "pre"
      },
      {
        test: /\.js$/,
        loader: "source-map-loader",
        exclude: /node_modules/,
        enforce: "pre"
      },
      {
        test: /\.html$/,
        loader: "html-loader?attrs=link:href"
      },
      {
        test: /\.json$/,
        loader: "json-loader"
      },
      {
        test: /\.jison$/,
        loader: "jison-loader"
      },
      {
        test: /\.raml$/,
        loader: "raml-validator-loader"
      },
      {
        test: /\.(ico|icns)$/,
        loader: "file-loader?name=./[hash]-[name].[ext]"
      },
      {
        test: /\.(ttf|woff)$/,
        loader: "file-loader?name=./fonts/source-sans-pro/[name].[ext]"
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /<!--\[if\sBOOTSTRAP-CSS\]><!\[endif\]-->/g,
              replacement(match, id, htmlContents) {
                // Remove requires() that were injected by webpack
                htmlContents = htmlContents.replace(
                  /"\s+\+\s+require\(".*?"\)\s+\+\s+"/g,
                  ""
                );
                // Load as if it were a module.
                const compiledHTML = requireFromString(htmlContents);

                const css = purifycss(compiledHTML, bootstrap.CSS, {
                  minify: true
                });

                // Webpack doo doo's its pants with some of this CSS for
                // some stupid reason. So this is why we encode the CSS.
                const encoded = new Buffer(css).toString("base64");
                const js = `var css = '${encoded}';css = atob(css);var tag = window.document.createElement('style');tag.innerHTML = css;window.document.head.appendChild(tag);`;
                return `<script>${js}</script>`;
              }
            }
          ]
        }),
        enforce: post
      }
    ]
  },
  node: {
    fs: "empty"
  },
  plugins: [
    new StringReplacePlugin(),

    new HtmlWebpackPlugin({
      template: "./src/index.html"
    }),

    new ExtractTextPlugin("./[name].css"),

    new WebpackNotifierPlugin({ alwaysNotify: true }),

    new webpack.optimize.CommonsChunkPlugin({ 
      name: "vendor", 
      filename: "vendor.js"
    }),

    new SVGCompilerPlugin({ baseDir: "src/img/components/icons" }),

    new webpack.LoaderOptionsPlugin({
      options: {
        htmlLoader: {
          whateverProp: true
        }
      }
    })
  ],

  resolve: {
    alias: {
      PluginSDK: absPath("src/js/plugin-bridge/PluginSDK"),
      PluginTestUtils: absPath("src/js/plugin-bridge/PluginTestUtils"),
      "#EXTERNAL_PLUGINS": externalPluginsDir,
      "#PLUGINS": absPath("plugins"),
      "#SRC": absPath("src")
    },
    // extensions: ["",".js", ".less", ".css"],
    // root: [absPath(), absPath("node_modules"), absPath("packages")],
    modules: ["node_modules", "packages"]
  },

  resolveLoader: {
    modules: [absPath("node_modules"), absPath("packages")]
  }
};
