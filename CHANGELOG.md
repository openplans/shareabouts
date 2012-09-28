Copy the following template when creating a new version entry:

2.X.x
-----------------------------
  * Bug Fixes:
    - ...

  * New Features:
    - ...

  * Upgrade Steps:
    - ...


2.0.0
-----------------------------
  * Started keeping versions

-------------------------------------------------------------------------------

# What the version numbers mean

We use this version scheme: 2.M.m-i

We'll be on 2 for a while, so we'll consider the 2nd number the major version.
The major version changes when we introduce code that requires users to change
their code to keep it working (backwards-incompatible change).  The minor
number may change when we add a significant feature. If a change will not break
existing users' instances, but they may make a change to take advantage of some
new functionality, the minor version should be bumped.

The incremental version will usually not change, though may be useful for
support purposes.  It may be a letter or a number or a datetime stamp.  We'll
figure that out when we have a use for it.

# What version am I on

Whichever version number heading is at the top of this file is the current
version of this project.

# When to mark a version

Any time we introduce a new feature, or make a change in a current feature, we
should mark a new version.  Each version should correspond to a tag in the git
repository.

# How to mark a new version

1.  Update this file.  Whatever's under the heading 'Development (master)'
    will now be under a new heading corresponding to the new version number.
2.  Commit this file, and create a tag labeled with the version number.
3.  Add a new 'Development (master)' section for recording ongoing changes.
