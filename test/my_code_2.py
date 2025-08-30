 import random

class Character:
    def __init__(self, name, health):
        self.name = name
        self.health = health

    def attack(self, target):
        damage = random.randint(1, 10)
        target.health -= damage
        print(f"{self.name} attacks {target.name} for {damage} damage!")

    def is_alive(self):
        return self.health > 0

hero = Character("Hero", 100)
enemy = Character("Goblin", 50)

while hero.is_alive() and enemy.is_alive():
    hero.attack(enemy)
    if not enemy.is_alive():
        print(f"{enemy.name} is defeated!")
        break

    enemy.attack(hero)
    if not hero.is_alive():
        print(f"{hero.name} is defeated!")
        break