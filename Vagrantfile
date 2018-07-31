VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.define "default"
  config.vm.box = "centos/7"
  config.vm.synced_folder ".", "/vagrant",
    :mount_options => ["dmode=777,fmode=777"]

  config.vm.provision "baseinstall", type: "ansible" do |ansible|
    ansible.playbook = "mechaoperator_playbook.yml"
    ansible.vault_password_file = "conf/vault_pass.txt"    
    
    # default vm gets baseinstall ansible inventory group
    ansible.groups = {
      "baseinstall" => ["default"]
    }
  end    

  config.vm.provider :virtualbox do |vb|
    # this creates vboxnet0 and vboxnet1, with pingable eth1 on vboxnet1
    config.vm.network "private_network", type: "dhcp", :adapter => 2    
    # uncomment to disable headless mode
    # vb.gui = true
  end

end
