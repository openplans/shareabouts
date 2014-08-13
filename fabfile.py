# -*- coding: utf-8 -*-
#
# Simple fabfile for CrowdSpot deployment.  At the moment hard-wired
# for deployment to "production" stack
#

# fab -R production create:site=somesite.crowdspot.com.au
# fab -R production deploy:site=somesite.crowdspot.com.au
#
# TODO the "create" fabric command should use the latest version of
# the "demo.crowdspot.com.au" site as the basis for the new site.
#


from fabric.api import abort, cd, env, get, hide, hosts, local, prompt, \
    put, require, roles, run, runs_once, settings, show, sudo, task, warn
from fabric.context_managers import prefix
from fabric.operations import open_shell


# vital for authentication with remote repository
env.forward_agent = True

# TODO allow for different stacks (poss. just revert to use of
# --gateway commandline arg
env.gateway = 'production-gw-ap-southeast-2a.crowdspot.com.au'

env.hosts = [
    'ip-10-37-2-185.ap-southeast-2.compute.internal',
    'ip-10-37-2-212.ap-southeast-2.compute.internal',
]

@task
def uname():
    """Pretty much just an example task.

    """
    run('uname -a')

@task
def djshell(site):
    """Opens a Django shell on the server.

    """
    with cd('/home/vhosts/{site}.crowdspot.com.au/code/src'.format(site=site)):
        with prefix('source ../../env/bin/activate'):
            run('./manage.py shell --settings=project.settings')

@task
def dbshell(site):
    """Opens a db shell on the server.

    """
    with cd('/home/vhosts/{site}.crowdspot.com.au/code/src'.format(site=site)):
        with prefix('source ../../env/bin/activate'):
            run('./manage.py dbshell --settings=project.settings')

@task
def shell():
    """Opens a simple shell on the server.

    """
    open_shell()

@task
def fetch(site):
    """Fetches code from the remote repo.

    """
    with cd('/home/vhosts/{site}.crowdspot.com.au/repo.git'.format(site=site)):
        with hide('stdout'):
            run('git fetch')

@task
def checkout(site, revision=None):
    """Check out a revision to the remote worktree.

    """
    if revision is None:
        # # work out when the current local commit is
        # refspec = local('git symbolic-ref HEAD',
        #                 capture=True).strip()
        revision = local('git rev-parse --verify HEAD',
                         capture=True).strip()

    with cd('/home/vhosts/{site}.crowdspot.com.au/repo.git'.format(site=site)):
        # TODO replace with a more atomic replacement of current
        # worktree ("code" dir)
        #run('rm -rf ../../code/*')
        run('git checkout -f {revision}'.format(revision=revision))

@task
def restart():
    """Sends SIGHUP to supervisor master to restart workers.

    TODO if supervisord isn't already running this will fail.  Deal
    with that situation.

    TODO make it restart just the workers for the site

    """
    sudo('kill -HUP $(cat /var/run/supervisord.pid)')

# @task
# @runs_once
# def syncdb(site):
#     """Django syncdb.

#     """
#     with cd('/home/vhosts/{site}.crowdspot.com.au/code/src'.format(site=site)):
#         with prefix('source ../../env/bin/activate'):
#             run('./manage.py syncdb --settings=project.settings')

# @task
# @runs_once
# def migrate(site):
#     """Django migrate.

#     """
#     with cd('/home/vhosts/{site}.crowdspot.com.au/code/src'.format(site=site)):
#         with prefix('source ../../env/bin/activate'):
#             run('./manage.py migrate --settings=project.settings')

@task
def requirements(site):
    """Install requirements.

    TODO again this is hardcoded to a single requirements file.

    """
    with cd('/home/vhosts/{site}.crowdspot.com.au/code'.format(site=site)):
        with prefix('source ../env/bin/activate'):
            run('pip install -r requirements.txt')

@task
def deploy(site, revision=None):
    """Compound command to do a full deploy.

    """
    fetch(site=site)
    checkout(site=site, revision=revision)
    #requirements()
    #syncdb()
    #migrate()
    restart()
