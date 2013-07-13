import bs4
from bs4 import BeautifulSoup
import pycurl
import re
import urllib2
import codecs

subjectsFile = open('subjects.txt.old', 'r')
# headFile = open('head.txt', 'r')
# footerFile = open('footer.txt', 'r')

outputFile = open('courses.html', 'w')
# output = '<!doctype html><html><head><title>All Yale Courses</title><link rel="stylesheet" type="text/css" href="style.css"></head><body>'
output = '' # headFile.read()

rootURL = 'http://catalog.yale.edu/ycps/subjects-of-instruction/'
subject = subjectsFile.readline() # ''.join(subjectsFile.readline().split())   
i=0
while i < 5 and subject:
    formattedSubject = subject
    subject = re.sub(' and| the', '', subject)
    subject = re.sub('[.!\n\',;]', '', subject)
    subject = re.sub(' +', '-', subject)
    if not re.search('See', subject):
        subject = subject.lower()
        url = rootURL + subject + '/#coursestext'
        url = url.rstrip("\n").rstrip("/") 
        try:
            site = urllib2.urlopen(urllib2.Request(url))
            html = urllib2.unquote(site.read())
            givenURL = url
            finalURL = site.geturl().rstrip("/")
            soup = BeautifulSoup(html)

            while soup.noscript:
                soup.noscript.decompose()
            while soup.script:
                soup.script.decompose()
            while soup.style:
                soup.style.decompose()
            
            content = soup.find(id='content')
            content['id'] = ''
            content['class'] = 'content'
            
            description = soup.find(id='textcontainer')
            if description: description.decompose()

            tabs = soup.find(id='tabs')
            if tabs: tabs.decompose()

            # springCourses = soup.find_all(text=re.compile("([0-9]{3}b)+"))
            # print springCourses
            # for tag in springCourses:
            #     if tag and tag.parent.parent.parent:
            #         tag.parent.parent.parent.decompose()

            if not content:
                print 'error: ' + subject
            else:
                content = content.prettify()
                content = content.encode('ascii', 'xmlcharrefreplace')
                output += '<section id="' + subject + '">'
                output += content
                output += '</section>'
        except:
            print 'error: ' + subject
            print '>' +formattedSubject

    subject = subjectsFile.readline()
    # i += 1
    # subject = None

# output += footerFile.read()
outputFile.write(output)
outputFile.close()
print 'Done!'
