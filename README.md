## Test mechaoperator from `src/mechaoperator` directory:

```
npm install mocha sinon
npm install q sqlite3 moment irc
node_modules/.bin/mocha test/test_info.js
node_modules/.bin/mocha test/test_client.js
# smoke tests to eyeball results of
node test/manual_test_info.js
cp ../conf/secrets.js secrets.js
node test/manual_test_snspoller.js
```

## Deploy mechaoperator to eurydice:

* Set up virtualbox
* execute [README.virtualbox](README.virtualbox)

## Deploy mechaoperator to vpnbox-prod-foo

note: update deploy/hosts if deploying to vpnbox-prod-bar

* have `deploy/packages.yml`, `deploy/filesystem.yml` done

```
ansible-playbook -i deploy/hosts mechaoperator_playbook_vpnbox.yml --vault-password-file=conf/vault_pass.txt
```

## Deploy cmdlineclient to eurydice

* have `deploy/packages.yml`, `deploy/filesystem.yml` done

```
ansible-playbook -i deploy/hosts cmdlineclient_playbook_eurydice.yml --vault-password-file=conf/vault_pass.txt
```

## Deploy backupbox to eurydice

```
ansible-playbook -i deploy/hosts backupbox_playbook.yml --vault-password-file=conf/vault_pass.txt
```

## Deploy logpublisher to eurydice

```
XXX update src/logpublisher/config.py
XXX have pip3 boto package installed
ansible-playbook -i deploy/hosts logpublisher_playbook_eurydice.yml
```
