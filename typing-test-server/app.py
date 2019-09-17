from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import random

app = Flask(__name__)

CORS(app)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://quyen:123@localhost:5432/typing-test'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
Migrate(app, db)


def get_random_el(arr):
    return random.choice(arr)


class Excerpt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    scores = db.relationship('Score', backref='excerpt', lazy=True)

    def sort_scores(self):
        return sorted(self.scores, key=lambda e: e.wpm, reverse=True)


class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wpm = db.Column(db.Integer, nullable=False)
    errors = db.Column(db.Integer)
    time = db.Column(db.Integer)
    excerpt_id = db.Column(db.Integer, db.ForeignKey('excerpt.id'))


db.create_all()


@app.route('/excerpts')
def list():
    item = get_random_el(Excerpt.query.all())
    excerpt = {'excerpt': {
        'id': item.id,
        'body': item.body,
        'scores': {
            'top_scores': [
                {'id': score.id,
                 'wpm': score.wpm} for score in item.sort_scores()[:3]
            ]
        },
        'scores_count': len(item.scores)
    }}
    print(jsonify(excerpt))
    return jsonify(excerpt)


@app.route('/post-score', methods=['POST'])
def post_score():
    score = Score(wpm=request.get_json()['wpm'],
                  errors=request.get_json()['errors'],
                  time=request.get_json()['time'],
                  excerpt_id=request.get_json()['id'])
    db.session.add(score)
    db.session.commit()
    excerpt = Excerpt.query.get(request.get_json()['id'])
    return jsonify({'status': 'success',
                    'total_attempts': len(excerpt.scores),
                    'ranking': excerpt.sort_scores().index(score) + 1,
                    'top_scores': [
                        {'id': score.id,
                        'wpm': score.wpm} for score in excerpt.sort_scores()[:3]
                    ]
                     })


if __name__ == '__main__':
    app.run(debug=True)
