#!/bin/bash

#https://developers.google.com/closure/utilities/docs/linter_howto

# check if gjslint exist or not.
if ! type gjslint
then
  echo "install closure-linter via easy_install"
  curDir=$PWD
  cd /tmp
  sudo easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz
  cd $PWD
fi

if [ -f ../.git/hooks/pre-commit ]
then
  echo "pre-commit hook exists. Please merge the hook manually"
  return 1;
fi

echo "copy pre-commit to .git/hooks/"
cp pre-commit ../.git/hooks/

