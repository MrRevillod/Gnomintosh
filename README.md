This is a Gnome/Arch Linux customization guide for "Gnomintosh" 
Guide by MrRevillod
Probada en Manjaro/Gnome 42

Packages and repository links:

    WHITESUR THEME (Firefox):

        Github.com/vinceliuice/WhiteSur-gtk-theme

    FILDEM GLOBAL MENU:

        Github.com/gonzaarcr/Fildem

    Gnome shell, themes, icons, cursors and fonts: 

        gnome-look.org (Whitesur Themes)

Extensions:

    Big sur status area
    Blur my shell
    Compiz alike magic lamp effect
    Compiz alike window effect
    Dash to Dock for COSMIC
    Desktop Icons NG
    Fildem global menu
    Just Perfection
    Logo menu
    Places status Indicator
    Refresh wifi connections
    Remove app menu
    Rounded corners
    Sound Input & Output and Choose Devices
    Tweaks & Extensions in system menu
    User themes
    Vitals
        
For all distibutions based on Archlinux

    sudo pacman -Syuu

Install yay:

    sudo pacman -S base-devel
    cd /place 
    git clone https://aur.archlinux.org/yay.git
    cd yay
    makepkg -si

Installing Gnome's addons

    Install Gnome Tweaks:

        sudo pacman -S gnome-tweaks

    Download and install Gnome Extensions:

        https://extensions.gnome.org/

        Enable "User Themes" extension

Clone Gnomintosh git repository:

    cd *place*
    git clone https://github.com/MrRevillod/MyGnomeDesktop.git

Install Gnome shell, themes, icons, cursors and fonts:

    On Gnomintosh folder:

        Show hidden files
        Move themes folder to /home as .themes
        Move icons folder to /home as .icons
        Move fonts folder to home/.local/share
        Move extensions folder to home/.local/share/gnome-shell
        Mover Wallpapers folder to home/Pictures

    Select themes, icons and cursors
    Enable all extensions except "Fildem Global Menu"

    Fonts:

        SF Pro Display Regular
        SF Pro Display Regular
        Source Code Pro Regular
        SF Pro Display Regular

    Top Bar
        Weekday ON

    Windows Titlebar 
        Left

    Windows
        Center New Windows ON


Fildem Global Menu:

    sudo pacman -S bamf appmenu-gtk-module libkeybinder3 libdbusmenu-gtk2 libdbusmenu-gtk3 libdbusmenu-qt5 git python-pip

    python3 -m pip install --user fuzzysearch

    cd Gnomintosh/Fildem-0.6.7

    sudo python3 setup.py install --optimize=1

    cp -r fildemGMenu@gonza.com ~/.local/share/gnome-shell/extensions/

    On terminal:

        gedit ~/.gtkrc-2.0 : gtk-modules="appmenu-gtk-module"

        gedit ~/.config/gtk-3.0/settings.ini : 

        if it's empty paste:

            [Settings]
            gtk-modules="appmenu-gtk-module"

        else paste: gtk-modules="appmenu-gtk-module" under [Settings].

    Enable fildem extension on manager app
    Reboot pc
    Enter the command "fildem" in the terminal.

    To launch fildem on startup:

        gedit ~/.config/autostart/fildem.desktop

        Paste:

        [Desktop Entry]
        Type=Application
        Exec=fildem
        Hidden=false
        NoDisplay=false
        X-GNOME-Autostart-enabled=true
        Name[en_US]=Fildem
        Name=Fildem
        Comment[en_US]=Fildem Global Menu and HUD
        Comment=Fildem Global Menu and HUD
        
    On Extensions manager disable "Show menu only......" option.


    cp /usr/share/applications/org.gnome.gedit.desktop ~/.local/share/applications/

    sed -i 's/^Exec=/Exec=env UBUNTU_MENUPROXY=0 /g' ~/.local/share/applications/org.gnome.gedit.desktop

    sed -i 's/DBusActivatable=.*/DBusActivatable=false/' ~/.local/share/applications/org.gnome.gedit.desktop

Customize Firefox web browser:

    yay -S firefox-appmenu-bin

    sync account

    cd Gnomintosh/WhiteSur-gtk-theme

        ./tweaks.sh -f


