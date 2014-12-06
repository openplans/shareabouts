# Run the python tests
src/manage.py test sa_web
STATUS=$?
if [ $STATUS -ne 0 ]
then exit $STATUS
fi
