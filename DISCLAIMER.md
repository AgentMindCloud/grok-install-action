# Disclaimer

This GitHub Action is provided **"as is"**, without warranty of any kind,
express or implied, including but not limited to the warranties of
merchantability, fitness for a particular purpose, and non-infringement. In no
event shall the authors or copyright holders be liable for any claim, damages,
or other liability, whether in an action of contract, tort, or otherwise,
arising from, out of, or in connection with the action or the use or other
dealings in it.

The action installs the [`grok-install`](https://pypi.org/project/grok-install/)
package from PyPI at runtime via `pip install` and executes it against files
in the repository it is invoked on. You are responsible for reviewing the
CLI's behavior and for the security posture of the workflows that consume
this action. Pin `cli-version` in production workflows to avoid unexpected
changes from upstream releases.

This project is not affiliated with, endorsed by, or sponsored by GitHub, xAI,
or any third party referenced in documentation.
