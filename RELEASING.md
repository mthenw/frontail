# Releasing Frontail

After all [pull requests](https://github.com/mthenw/frontail/pulls) for a release have been merged and all [Travis CI builds](https://travis-ci.org/mthenw/frontail) are green, you may create a release as follows:

1. If you haven't already, switch to the master branch, ensure that you have no changes, and pull from origin.

    ```sh
    $ git checkout master
    $ git status
    $ git pull <remote> master --rebase
    ```

1. Edit the `package.json` file changing `version` field to your new release version and run `npm i`.

1. Commit your changes.

    ```sh
    $ git commit -am "Release <version>"
    ```

1. Push the commit.

    ```sh
    $ git push origin head
    ```

1. GitHub action will publish new version to NPM and push new tag.

1. Publish new release on GitHub with [`release`](https://github.com/zeit/release) package.

    ```sh
    $ git pull
    $ npx release -P
    ```

1. Upload binaries

    ```sh
    $ npm run pkg
    ```