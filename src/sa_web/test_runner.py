from django.test.simple import DjangoTestSuiteRunner

class DatabaselessTestSuiteRunner (DjangoTestSuiteRunner):
    def setup_databases(self, **kwargs):
        pass
    
    def teardown_databases(self, old_config, **kwargs):
        pass
