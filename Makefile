all: npm python

npm:
	npm i
	npm run build
	npm i -g .

python:
	python -m venv venv
	. venv/bin/activate
	pip install -r requirements.txt
	python make_release.py
