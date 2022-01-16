import random
import requests
from bs4 import BeautifulSoup


class Jeoparty:
    def choose_random_episode(self):
        all_seasons_url = 'https://www.j-archive.com/listseasons.php'
        html = requests.get(all_seasons_url).content
        soup = BeautifulSoup(html, 'lxml')
        season_html_urls = soup.find('div', {'id': 'content'}).findAll('a')
        episode_data = []
        random_season_html_url = random.choice(season_html_urls)

        season_url = f"https://www.j-archive.com/{random_season_html_url.get('href')}"
        single_season_html = requests.get(season_url).content
        soup = BeautifulSoup(single_season_html, 'lxml')
        episode_html_urls = soup.find('div', {'id': 'content'}).findAll('a')
        valid_episode_html_urls = [html for html in episode_html_urls if 'j-archive.com/showgame' in html.get('href')]
        random_episode_html_url = random.choice(valid_episode_html_urls)
        episode_url = random_episode_html_url.get('href')
        if 'j-archive.com/showgame' in episode_url:
            return{
                    'url': random_episode_html_url.get('href'),
                    'taped': random_episode_html_url['title'] if 'title' in random_episode_html_url.attrs else None
                }

    def get_category_names(self, first_row):
        category_names = []
        for single_row_data in first_row.find_all('td', recursive=False):
            category_names.append(single_row_data.find('td', {'class': 'category_name'}).text)
        return category_names

    def get_all_clue_text(self, all_rows):
        all_clue_text = []
        for row in all_rows[1:]:
            all_row_data = row.find_all('td', recursive=False)
            for single_row_data in all_row_data:
                is_daily_double = False
                clue_value_daily_double_html = single_row_data.find('td', {'class': 'clue_value_daily_double'})
                if clue_value_daily_double_html:
                    is_daily_double = True
                clue_html = single_row_data.find('td', {'class': 'clue_text'})
                if clue_html:
                    clue_text = clue_html.text
                    answer_text = BeautifulSoup(single_row_data.find('div')['onmouseover'], 'lxml').find('em', {'class': 'correct_response'}).text
                else:
                    clue_text = "Oops! The J-archive databatase doesn\n't have this question."
                    answer_text = None
                all_clue_text.append(
                    {
                        'clue': clue_text,
                        'answer': answer_text,
                        'is_daily_double': is_daily_double
                })
        return all_clue_text

    def get_ordered_dollar_values(self, all_rows):
        all_dollar_values = []
        for row in all_rows[1:]:
            all_row_data = row.find_all('td', recursive=False)
            for single_row_data in all_row_data:
                clue_value_html = single_row_data.find('td', {'class': 'clue_value'})
                if clue_value_html:
                    all_dollar_values.append(int(clue_value_html.text[1:]))  # Remove the $ and convert to int
        return list(set(all_dollar_values))

    def initialize_category_dict(self, category_names, rows, is_double_jeop):
        category_dict = {}
        dollar_values = self.get_ordered_dollar_values(rows)
        for name in category_names:
            category_dict[name] = {}
            for dollar_value in dollar_values:
                category_dict[name][dollar_value] = None
        return category_dict

    def get_category_dict(self, soup, is_double_jeop):
        round_name = 'double_jeopardy_round' if is_double_jeop else 'jeopardy_round'
        clue_table = soup.find('div', {'id': round_name}).find('table', {'class': 'round'})
        rows = clue_table.find_all('tr', recursive=False)
        category_names = self.get_category_names(rows[0])
        all_clue_text = self.get_all_clue_text(rows)
        category_dict = self.initialize_category_dict(category_names, rows, is_double_jeop=is_double_jeop)
        clue_index = 0
        for dollar_value in self.get_ordered_dollar_values(rows):
            for category_name in category_dict.keys():
                print(category_name)
                category_dict[category_name][dollar_value] = all_clue_text[clue_index]
                clue_index += 1
        return category_dict

    def get_final_dict(self, soup):
        clue_table = soup.find('div', {'id': 'final_jeopardy_round'}).find('table', {'class': 'final_round'})
        category_name = clue_table.find('td', {'class': 'category_name'}).text
        clue_text = clue_table.find('td', {'class': 'clue_text'}).text
        answer_html_str = str(BeautifulSoup(clue_table.find('div')['onmouseover'], 'lxml'))
        answer_html_str_bw_parens = answer_html_str[answer_html_str.find("(")+1:answer_html_str.rfind(")")]
        final_answer = BeautifulSoup(answer_html_str_bw_parens, 'lxml').find('html').find('em', {'class': '\\"correct_response\\"'}).text
        return {
            'category_name': category_name,
            'clue_text': clue_text,
            'final_answer': final_answer}

    def parse(self):
        avail_episodes = self.choose_random_episode()

        url = 'https://www.j-archive.com/showgame.php?game_id=6975'
        html = requests.get(url).content
        soup = BeautifulSoup(html, 'lxml')
        game_title = soup.find('div', {'id': 'game_title'}).find('h1').text
        single_jeop_dict = self.get_category_dict(soup, is_double_jeop=False)
        double_jeop_dict = self.get_category_dict(soup, is_double_jeop=True)
        final_dict = self.get_final_dict(soup)
        print({
            'game_title': game_title,
            'single_jeop_dict': single_jeop_dict,
            'double_jeop_dict': double_jeop_dict,
            'final_dict': final_dict
        })
        return {
            'game_title': game_title,
            'single_jeop_dict': single_jeop_dict,
            'double_jeop_dict': double_jeop_dict,
            'final_dict': final_dict
        }


if __name__ == '__main__':
    Jeoparty().parse()